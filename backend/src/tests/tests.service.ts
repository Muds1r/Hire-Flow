import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  ApplicationEvaluatorStatus,
  Prisma,
  TestStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoredSection, StoredQuestion } from '../ai/ai.schemas';
import { TEST_SECTIONS_INCLUDE } from './test-sections.include';
import { QuestionBankService } from './question-bank.service';
import { buildGradingBundle, buildResultCreateInput } from './test-grading-bundle';
import {
  areStoredSectionsFullyBuilt,
  isTestFullyBuilt,
  QUESTIONS_REQUIRED_PER_SECTION,
} from './test-build.util';
import {
  parseJobAssessmentSectionConfig,
  type JobSectionConfig,
} from './job-section-config.util';
import { TestIntensityLevel } from '../common/test-intensity';

type TestWithSections = Prisma.TestGetPayload<{
  include: {
    application: { include: { job: true } };
    testSections: typeof TEST_SECTIONS_INCLUDE;
    answers: true;
    result: true;
  };
}>;

function questionPositionById(
  testSections: TestWithSections['testSections'],
): Map<string, { sectionIndex: number; questionIndex: number }> {
  const map = new Map<string, { sectionIndex: number; questionIndex: number }>();
  const sections = [...testSections].sort((a, b) => a.orderIndex - b.orderIndex);
  let si = 0;
  for (const sec of sections) {
    const questions = [...sec.questions].sort((a, b) => a.orderIndex - b.orderIndex);
    let qi = 0;
    for (const q of questions) {
      map.set(q.id, { sectionIndex: si, questionIndex: qi });
      qi++;
    }
    si++;
  }
  return map;
}

function stripQuestionForCandidate(q: {
  id: string;
  question: string;
  options: Prisma.JsonValue;
  category: string;
  difficulty: number;
}) {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty,
  };
}

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
    private bank: QuestionBankService,
  ) {}

  /** HR: (re)build draft assessment from job template + bank draws. */
  async generateForApplication(applicationId: string, hrUserId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { select: { email: true } },
        tests: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (app.status === ApplicationStatus.REJECTED || app.status === ApplicationStatus.HIRED) {
      throw new BadRequestException('Cannot generate test for terminal applications');
    }

    const blocking = app.tests.find((t) => {
      if (t.status === TestStatus.GRADED) {
        return false;
      }
      return (
        t.status === TestStatus.SENT ||
        t.status === TestStatus.IN_PROGRESS ||
        t.status === TestStatus.SUBMITTED ||
        t.status === TestStatus.AUTO_SUBMITTED
      );
    });
    if (blocking) {
      throw new BadRequestException(
        'An active assessment is already sent to the candidate. Wait until it is graded or abandoned before generating a new draft.',
      );
    }
    if (app.job.publishedAt == null) {
      throw new BadRequestException(
        'This job is not published yet. Wait for the evaluator assessment plan and for HR to publish.',
      );
    }
    if (!app.job.assessmentBankReady) {
      throw new BadRequestException(
        'Question bank is still preparing for this job. Try again shortly.',
      );
    }

    return this.buildAndPersistDraftForApplication(app);
  }

  private resolveSectionsForJob(job: {
    assessmentSectionConfig: unknown;
  }): JobSectionConfig[] {
    const fromConfig = parseJobAssessmentSectionConfig(job.assessmentSectionConfig);
    if (fromConfig?.length) {
      return fromConfig;
    }
    throw new BadRequestException(
      'This job has no evaluator assessment plan. Wait for an evaluator to submit a plan and for HR to publish the job.',
    );
  }

  private async buildAndPersistDraftForApplication(app: {
    id: string;
    job: {
      description: string;
      assessmentSectionTitles: unknown;
      assessmentSectionConfig: unknown;
    };
  }) {
    const sectionPlan = this.resolveSectionsForJob(app.job);

    const usedBankEntryIds = new Set<string>();
    const sections: StoredSection[] = [];
    for (const section of sectionPlan) {
      const questions = await this.buildSectionQuestions(
        section.title,
        app.job.description,
        usedBankEntryIds,
        section.intensity,
      );
      sections.push({ title: section.title, questions });
    }

    if (!areStoredSectionsFullyBuilt(sections)) {
      throw new BadRequestException(
        'Test is not fully generated. The draft was not saved.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.test.deleteMany({
        where: {
          applicationId: app.id,
          status: TestStatus.DRAFT,
        },
      });
      const created = await tx.test.create({
        data: {
          applicationId: app.id,
          status: TestStatus.DRAFT,
          questionSeconds: 25,
          testSections: {
            create: sections.map((sec, si) => ({
              title: sec.title,
              orderIndex: si,
              questions: {
                create: sec.questions.map((q, qi) => ({
                  question: q.question,
                  options: q.options as unknown as Prisma.InputJsonValue,
                  correctIndex: q.correctIndex,
                  explanation: q.explanation,
                  difficulty: q.difficulty,
                  category: q.category,
                  orderIndex: qi,
                  bankEntryId: (q as { bankEntryId?: string }).bankEntryId ?? null,
                })),
              },
            })),
          },
        },
      });
      await tx.application.update({
        where: { id: app.id },
        data: {
          status: ApplicationStatus.TEST_READY,
        },
      });
      return created;
    });
  }

  private async buildSectionQuestions(
    title: string,
    jobDescription: string,
    usedBankEntryIds: Set<string>,
    intensity: TestIntensityLevel = TestIntensityLevel.SOFTWARE_ENGINEER,
  ): Promise<(StoredQuestion & { bankEntryId?: string })[]> {
    return this.bank.selectBalancedQuestionsForSection({
      canonicalSkill: title,
      sectionSize: QUESTIONS_REQUIRED_PER_SECTION,
      usedBankEntryIds,
      jobDescription,
      intensity,
    });
  }

  /** HR: send draft assessment to candidate (visible in their portal). */
  async sendTestToCandidate(testId: string, hrUserId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        application: {
          include: {
            job: true,
            candidate: { select: { email: true } },
          },
        },
        testSections: { include: { questions: true } },
      },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    if (test.application.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (test.status !== TestStatus.DRAFT) {
      throw new BadRequestException('Only draft assessments can be sent.');
    }
    if (!isTestFullyBuilt(test)) {
      throw new BadRequestException(
        'Test is incomplete. Each section must have exactly 10 questions.',
      );
    }

    const bankIds = test.testSections.flatMap((s) =>
      s.questions.map((q) => q.bankEntryId).filter((id): id is string => !!id),
    );
    await this.bank.incrementUsage(bankIds);

    const updated = await this.prisma.$transaction([
      this.prisma.test.update({
        where: { id: testId },
        data: { status: TestStatus.SENT },
      }),
      this.prisma.application.update({
        where: { id: test.applicationId },
        data: { status: ApplicationStatus.TEST_SENT },
      }),
    ]);

    return updated[0];
  }

  private async loadTestForCandidate(testId: string, candidateId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        application: true,
        answers: true,
        testSections: TEST_SECTIONS_INCLUDE,
      },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    if (test.application.candidateId !== candidateId) {
      throw new ForbiddenException();
    }
    if (test.status === TestStatus.DRAFT) {
      throw new ForbiddenException('This assessment has not been released yet.');
    }
    return test;
  }

  async getCandidatePayload(testId: string, candidateId: string) {
    let test = await this.loadTestForCandidate(testId, candidateId);
    if (test.status === TestStatus.SENT) {
      const now = new Date();
      await this.prisma.test.update({
        where: { id: testId },
        data: { status: TestStatus.IN_PROGRESS, startedAt: now },
      });
      await this.prisma.application.update({
        where: { id: test.applicationId },
        data: { status: ApplicationStatus.TEST_STARTED },
      });
      test = await this.loadTestForCandidate(testId, candidateId);
    }
    const posByQ = questionPositionById(test.testSections);
    const sections = [...test.testSections]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((sec) => ({
        title: sec.title,
        questions: [...sec.questions]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(stripQuestionForCandidate),
      }));
    const answers = test.answers.map((a) => {
      const pos = posByQ.get(a.questionId);
      return {
        sectionIndex: pos?.sectionIndex ?? 0,
        questionIndex: pos?.questionIndex ?? 0,
        selectedOption: a.selectedOption,
        locked: a.locked,
      };
    });
    return {
      id: test.id,
      status: test.status,
      questionSeconds: test.questionSeconds,
      violationCount: test.violationCount,
      violationThreshold: test.violationThreshold,
      startedAt: test.startedAt,
      sections,
      answers,
    };
  }

  async saveAnswer(
    testId: string,
    candidateId: string,
    dto: {
      sectionIndex: number;
      questionIndex: number;
      selectedOption?: number;
      lock?: boolean;
    },
  ) {
    const test = await this.loadTestForCandidate(testId, candidateId);
    if (test.status !== TestStatus.IN_PROGRESS && test.status !== TestStatus.SENT) {
      throw new BadRequestException('Test is not active');
    }
    const sections = [...test.testSections].sort((a, b) => a.orderIndex - b.orderIndex);
    const sec = sections[dto.sectionIndex];
    const questions = sec
      ? [...sec.questions].sort((a, b) => a.orderIndex - b.orderIndex)
      : [];
    const qRow = questions[dto.questionIndex];
    if (!sec || !qRow) {
      throw new BadRequestException('Invalid question reference');
    }
    const questionId = qRow.id;
    const existing = await this.prisma.answer.findUnique({
      where: { testId_questionId: { testId, questionId } },
    });
    if (existing?.locked) {
      throw new BadRequestException('Question is locked');
    }
    const lock = dto.lock ?? false;
    const rawOpt = dto.selectedOption;
    const hasOpt = rawOpt !== undefined && rawOpt !== null;

    let resolvedSelected: number | null;
    if (!lock) {
      if (!hasOpt || rawOpt < 0 || rawOpt > 3) {
        throw new BadRequestException(
          'selectedOption is required (0–3) when not locking',
        );
      }
      resolvedSelected = rawOpt;
    } else {
      if (hasOpt && (rawOpt < 0 || rawOpt > 3)) {
        throw new BadRequestException('selectedOption must be between 0 and 3');
      }
      resolvedSelected = hasOpt ? rawOpt : null;
    }

    return this.prisma.answer.upsert({
      where: { testId_questionId: { testId, questionId } },
      create: {
        testId,
        questionId,
        selectedOption: resolvedSelected,
        locked: lock,
        answeredAt: lock ? new Date() : null,
      },
      update: {
        selectedOption: existing?.locked
          ? existing.selectedOption
          : resolvedSelected,
        locked: existing?.locked ? true : lock,
        answeredAt:
          lock || existing?.locked ? new Date() : existing?.answeredAt ?? null,
      },
    });
  }

  async recordViolation(testId: string, candidateId: string) {
    const test = await this.loadTestForCandidate(testId, candidateId);
    if (test.status !== TestStatus.IN_PROGRESS && test.status !== TestStatus.SENT) {
      return test;
    }
    const updated = await this.prisma.test.update({
      where: { id: testId },
      data: { violationCount: { increment: 1 } },
    });
    if (updated.violationCount >= updated.violationThreshold) {
      await this.finalizeTest(testId, candidateId, 'AUTO_SUBMITTED');
    }
    return updated;
  }

  async submitManual(testId: string, candidateId: string) {
    await this.finalizeTest(testId, candidateId, 'SUBMITTED');
    return this.prisma.test.findUnique({
      where: { id: testId },
      include: { result: true },
    });
  }

  private async finalizeTest(
    testId: string,
    candidateId: string,
    endStatus: 'SUBMITTED' | 'AUTO_SUBMITTED',
  ) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        application: { include: { job: true } },
        answers: true,
        result: true,
        testSections: TEST_SECTIONS_INCLUDE,
      },
    });
    if (!test || test.application.candidateId !== candidateId) {
      throw new ForbiddenException();
    }
    if (test.result) {
      await this.repairSubmittedConsistencyForTest(testId);
      return;
    }

    const alreadySubmitted =
      test.status === TestStatus.SUBMITTED ||
      test.status === TestStatus.AUTO_SUBMITTED ||
      test.status === TestStatus.GRADED;

    if (alreadySubmitted) {
      const fresh = await this.prisma.test.findUnique({
        where: { id: testId },
        include: { result: true },
      });
      if (fresh?.result) {
        await this.repairSubmittedConsistencyForTest(testId);
        return;
      }
    } else if (
      test.status !== TestStatus.IN_PROGRESS &&
      test.status !== TestStatus.SENT
    ) {
      throw new BadRequestException('Test is not active');
    }

    const bundle = await buildGradingBundle(test);
    await this.bank.recordAttempts(bundle.bankRows).catch(() => undefined);

    const submittedAt = bundle.submittedAt;
    const needsSubmitTransition =
      test.status === TestStatus.IN_PROGRESS || test.status === TestStatus.SENT;
    const resultPayload = buildResultCreateInput(testId, test, bundle);

    await this.prisma.$transaction([
      ...(needsSubmitTransition
        ? [
            this.prisma.test.update({
              where: { id: testId },
              data: {
                status: endStatus,
                submittedAt,
              },
            }),
            this.prisma.application.update({
              where: { id: test.applicationId },
              data: { status: ApplicationStatus.TEST_SUBMITTED },
            }),
          ]
        : []),
      this.prisma.result.upsert({
        where: { testId },
        create: resultPayload,
        update: {},
      }),
      this.prisma.test.update({
        where: { id: testId },
        data: { status: TestStatus.GRADED },
      }),
      this.prisma.application.update({
        where: { id: test.applicationId },
        data: { status: ApplicationStatus.GRADED },
      }),
    ]);
  }

  async tryHrGradeIfMissingResult(testId: string, hrUserId: string): Promise<void> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        application: { include: { job: true } },
        answers: true,
        result: true,
        testSections: TEST_SECTIONS_INCLUDE,
      },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    if (test.application.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (test.result) {
      return;
    }
    if (test.status !== TestStatus.SUBMITTED && test.status !== TestStatus.AUTO_SUBMITTED) {
      throw new BadRequestException(
        'Cannot grade until the candidate has submitted the assessment (no result is created for tests still in SENT or IN_PROGRESS).',
      );
    }

    const bundle = await buildGradingBundle(test);
    await this.bank.recordAttempts(bundle.bankRows).catch(() => undefined);

    if (test.application.status === ApplicationStatus.TEST_STARTED) {
      await this.prisma.application.update({
        where: { id: test.applicationId },
        data: { status: ApplicationStatus.TEST_SUBMITTED },
      });
    }

    const resultPayload = buildResultCreateInput(testId, test, bundle);

    await this.prisma.$transaction([
      this.prisma.result.upsert({
        where: { testId },
        create: resultPayload,
        update: {},
      }),
      this.prisma.test.update({
        where: { id: testId },
        data: { status: TestStatus.GRADED },
      }),
      this.prisma.application.update({
        where: { id: test.applicationId },
        data: { status: ApplicationStatus.GRADED },
      }),
    ]);
  }

  async repairSubmittedConsistencyForTest(testId: string): Promise<void> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { application: true, result: true },
    });
    if (!test?.result) {
      return;
    }
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (test.status !== TestStatus.GRADED) {
      ops.push(
        this.prisma.test.update({
          where: { id: testId },
          data: {
            status: TestStatus.GRADED,
            submittedAt: test.submittedAt ?? new Date(),
          },
        }),
      );
    }
    const appNeedsGraded =
      test.application.status === ApplicationStatus.TEST_SUBMITTED ||
      test.application.status === ApplicationStatus.TEST_STARTED;
    if (appNeedsGraded) {
      ops.push(
        this.prisma.application.update({
          where: { id: test.applicationId },
          data: { status: ApplicationStatus.GRADED },
        }),
      );
    }
    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }
  }

  async getHrResultView(
    testId: string,
    user: {
      userId: string;
      role: string;
    },
  ) {
    await this.repairSubmittedConsistencyForTest(testId);
    if (user.role === UserRole.HR) {
      try {
        await this.tryHrGradeIfMissingResult(testId, user.userId);
      } catch (e) {
        if (!(e instanceof BadRequestException)) {
          throw e;
        }
      }
    }

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        application: {
          include: {
            job: true,
            candidate: true,
            _count: { select: { evaluatorAssignments: true } },
          },
        },
        result: true,
        testSections: TEST_SECTIONS_INCLUDE,
      },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    if (user.role === UserRole.HR) {
      if (test.application.job.createdById !== user.userId) {
        throw new ForbiddenException();
      }
    } else if (user.role !== UserRole.EVALUATOR) {
      throw new ForbiddenException();
    } else {
      const assign = await this.prisma.applicationEvaluator.findUnique({
        where: {
          applicationId_evaluatorId: {
            applicationId: test.applicationId,
            evaluatorId: user.userId,
          },
        },
      });
      if (!assign) {
        throw new ForbiddenException(
          'You are not assigned to this application.',
        );
      }
      if (test.application.status !== ApplicationStatus.UNDER_REVIEW) {
        throw new ForbiddenException(
          'This assessment is not available for evaluator review yet.',
        );
      }
      await this.prisma.applicationEvaluator.updateMany({
        where: {
          applicationId: test.applicationId,
          evaluatorId: user.userId,
          status: ApplicationEvaluatorStatus.PENDING,
        },
        data: { status: ApplicationEvaluatorStatus.IN_REVIEW },
      });
    }

    const payload = this.formatHrTestPayload(test);
    if (user.role === UserRole.HR) {
      return payload;
    }
    if (user.role === UserRole.EVALUATOR) {
      const my = await this.prisma.applicationEvaluator.findUnique({
        where: {
          applicationId_evaluatorId: {
            applicationId: test.applicationId,
            evaluatorId: user.userId,
          },
        },
        select: {
          passForNextPhase: true,
          reviewSummary: true,
          reviewSubmittedAt: true,
          status: true,
        },
      });
      return {
        ...payload,
        myEvaluatorReview: my
          ? {
              passForNextPhase: my.passForNextPhase,
              reviewSummary: my.reviewSummary,
              reviewSubmittedAt: my.reviewSubmittedAt,
              assignmentStatus: my.status,
            }
          : null,
      };
    }
  }

  private formatHrTestPayload(
    test: Prisma.TestGetPayload<{
      include: {
        application: {
          include: {
            job: true;
            candidate: true;
            _count: { select: { evaluatorAssignments: true } };
          };
        };
        testSections: typeof TEST_SECTIONS_INCLUDE;
        result: true;
      };
    }>,
  ) {
    const sections = [...test.testSections]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((sec) => ({
        title: sec.title,
        questions: [...sec.questions]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            difficulty: q.difficulty,
            category: q.category,
            bankEntryId: q.bankEntryId,
          })),
      }));

    const app = test.application;

    return {
      id: test.id,
      status: test.status,
      sections,
      result: test.result,
      violationCount: test.violationCount,
      startedAt: test.startedAt,
      submittedAt: test.submittedAt,
      application: {
        id: app.id,
        status: app.status,
        sentToEvaluatorsAt: app.sentToEvaluatorsAt,
        aiStatus: app.aiStatus,
        evaluatorAssignmentCount: app._count.evaluatorAssignments,
        candidate: app.candidate,
        job: { id: app.job.id, title: app.job.title },
      },
    };
  }
}
