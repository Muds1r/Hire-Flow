import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationEvaluatorStatus,
  ApplicationRejectionReason,
  ApplicationStatus,
  AiProcessingStatus,
  TestStatus,
  UserRole,
} from '@prisma/client';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CvService } from '../cv/cv.service';
import { AiService, CvParsed } from '../ai/ai.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { SubmitEvaluatorReviewDto } from './dto/submit-evaluator-review.dto';
import { TestsService } from '../tests/tests.service';
import { paginationArgs, toPaginatedResult } from '../common/pagination.util';
import { DEFAULT_PAGE_SIZE } from '../common/dto/pagination-query.dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private cv: CvService,
    private ai: AiService,
    private config: ConfigService,
    private tests: TestsService,
  ) {}

  private uploadRoot() {
    return path.resolve(
      process.cwd(),
      this.config.get<string>('UPLOAD_DIR') ?? 'uploads',
    );
  }

  /** HR: assign evaluators to an application (idempotent per evaluator). */
  async assignEvaluators(
    applicationId: string,
    hrUserId: string,
    evaluatorIds: string[],
  ) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    const uniqueIds = [...new Set(evaluatorIds)];
    const evalUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds }, role: UserRole.EVALUATOR, isActive: true },
      select: { id: true },
    });
    if (evalUsers.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Every id must refer to an existing user with the Evaluator role.',
      );
    }
    await this.prisma.applicationEvaluator.createMany({
      data: uniqueIds.map((evaluatorId) => ({
        id: randomUUID(),
        applicationId,
        evaluatorId,
        assignedById: hrUserId,
      })),
      skipDuplicates: true,
    });
    return this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        evaluatorAssignments: {
          include: {
            evaluator: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
  }

  private scheduleCvAiProcessing(applicationId: string) {
    void this.runCvAiProcessing(applicationId).catch((err) => {
      this.logger.error(
        `CV/AI pipeline failed for application ${applicationId}`,
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  private async runCvAiProcessing(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      return;
    }
    if (!this.ai.canUseAi()) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { aiStatus: AiProcessingStatus.COMPLETED },
      });
      return;
    }
    const cvText = app.cvText ?? '';
    if (!cvText.length) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { aiStatus: AiProcessingStatus.COMPLETED },
      });
      return;
    }
    try {
      const cvParsed = await this.ai.parseCv(cvText);
      const matchResult = await this.ai.matchJdToCv(
        app.job.description,
        cvText,
        cvParsed as CvParsed,
      );
      const row = await this.prisma.application.findUnique({
        where: { id: applicationId },
        select: { status: true },
      });
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          cvParsed: cvParsed as object,
          matchResult: matchResult as object,
          aiStatus: AiProcessingStatus.COMPLETED,
          ...(row?.status === ApplicationStatus.APPLIED
            ? { status: ApplicationStatus.CV_ANALYZED }
            : {}),
        },
      });
    } catch {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: { aiStatus: AiProcessingStatus.FAILED },
      });
    }
  }

  async createWithCv(
    user: JwtUser,
    jobId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CV file is required');
    }
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        closedAt: true,
        publishedAt: true,
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.closedAt != null) {
      throw new BadRequestException(
        'This job listing is closed and no longer accepts applications.',
      );
    }
    if (job.publishedAt == null) {
      throw new BadRequestException(
        'This job is not published yet and does not accept applications.',
      );
    }
    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId, candidateId: user.userId },
      },
    });
    if (existing) {
      throw new ConflictException('You already applied to this job');
    }

    const ext = path.extname(file.originalname || '') || '.bin';
    const key = path.join(user.userId, `${randomUUID()}${ext}`);
    const abs = path.join(this.uploadRoot(), key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, file.buffer);

    let cvText = '';
    try {
      cvText = await this.cv.extractText(file.buffer, file.mimetype);
    } catch (e) {
      await fs.unlink(abs).catch(() => undefined);
      throw e;
    }

    const needsAsyncAi = this.ai.canUseAi() && cvText.length > 0;
    const aiStatus = needsAsyncAi
      ? AiProcessingStatus.PENDING
      : AiProcessingStatus.COMPLETED;

    const created = await this.prisma.application.create({
      data: {
        jobId,
        candidateId: user.userId,
        cvFileKey: key,
        cvMimeType: file.mimetype,
        cvText,
        status: ApplicationStatus.APPLIED,
        aiStatus,
      },
      include: {
        job: { select: { id: true, title: true } },
      },
    });

    if (needsAsyncAi) {
      this.scheduleCvAiProcessing(created.id);
    }

    return created;
  }

  private hrListInclude() {
    return {
      job: { select: { id: true, title: true, closedAt: true } },
      candidate: { select: { id: true, email: true, name: true } },
      tests: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: { id: true, status: true },
      },
      evaluatorAssignments: {
        include: {
          evaluator: { select: { id: true, email: true, name: true } },
        },
      },
    } as const;
  }

  private async repairLatestTestConsistency(
    apps: Array<{ tests: Array<{ id: string; result: unknown }> }>,
  ) {
    for (const a of apps) {
      const t = a.tests[0];
      if (t?.result && t.id) {
        await this.tests.repairSubmittedConsistencyForTest(t.id);
      }
    }
  }

  async listForUser(user: JwtUser) {
    if (user.role === UserRole.CANDIDATE) {
      const apps = await this.prisma.application.findMany({
        where: { candidateId: user.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          job: true,
          tests: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { result: true },
          },
        },
      });
      await this.repairLatestTestConsistency(apps);
      return apps.map((a) => ({
        ...a,
        tests: a.tests.map((t) => ({ id: t.id, status: t.status })),
      }));
    }
    if (user.role === UserRole.HR) {
      const apps = await this.prisma.application.findMany({
        where: { job: { createdById: user.userId } },
        orderBy: { createdAt: 'desc' },
        include: {
          ...this.hrListInclude(),
          tests: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { result: true },
          },
        },
      });
      await this.repairLatestTestConsistency(apps);
      return apps.map((a) => ({
        ...a,
        tests: a.tests.map((t) => ({ id: t.id, status: t.status })),
      }));
    }
    return this.prisma.application.findMany({
      where: {
        evaluatorAssignments: { some: { evaluatorId: user.userId } },
        status: ApplicationStatus.UNDER_REVIEW,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, createdById: true } },
        candidate: { select: { id: true, email: true, name: true } },
        tests: { select: { id: true, status: true } },
        evaluatorAssignments: {
          where: { evaluatorId: user.userId },
          include: {
            evaluator: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
  }

  /** HR pipeline: rejected applications, paginated (job close date, then updatedAt). */
  async listRejectedForHr(hrUserId: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
    const { page: p, limit: l, skip } = paginationArgs(page, limit);
    const where = {
      status: ApplicationStatus.REJECTED,
      job: { createdById: hrUserId },
    };
    const include = {
      job: { select: { id: true, title: true, closedAt: true } },
      candidate: { select: { id: true, email: true, name: true } },
      tests: { select: { id: true, status: true } },
      evaluatorAssignments: {
        include: {
          evaluator: { select: { id: true, email: true, name: true } },
        },
      },
    } as const;

    const [total, items] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        orderBy: [
          { job: { closedAt: { sort: 'desc', nulls: 'last' } } },
          { updatedAt: 'desc' },
        ],
        skip,
        take: l,
        include,
      }),
    ]);

    return toPaginatedResult(items, total, p, l);
  }

  /** HR pipeline board: applications for one open published job. */
  async listPipelineForHr(hrUserId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        createdById: hrUserId,
        closedAt: null,
        publishedAt: { not: null },
      },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found or not open for pipeline');
    }

    const apps = await this.prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        ...this.hrListInclude(),
        tests: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { result: true },
        },
      },
    });
    await this.repairLatestTestConsistency(apps);
    return apps.map((a) => ({
      ...a,
      tests: a.tests.map((t) => ({ id: t.id, status: t.status })),
    }));
  }

  /** HR closed job page: all applications for one owned job. */
  async listByJobForHr(hrUserId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, createdById: hrUserId },
      select: { id: true },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: this.hrListInclude(),
    });
  }

  async getOne(id: string, user: JwtUser) {
    const testsInclude =
      user.role === UserRole.CANDIDATE
        ? ({ select: { id: true, status: true } } as const)
        : ({
            include: {
              result: true,
              testSections: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  orderIndex: true,
                  _count: { select: { questions: true } },
                },
              },
            },
          } as const);

    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: { select: { id: true, email: true, name: true } },
        tests: testsInclude as never,
        ...((user.role === UserRole.HR || user.role === UserRole.EVALUATOR)
          ? {
              evaluatorAssignments: {
                include: {
                  evaluator: { select: { id: true, email: true, name: true } },
                },
              },
            }
          : {}),
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    await this.assertCanAccessApplication(user, app);
    return app;
  }

  /** Stream uploaded CV (HR: any stage; evaluator: assigned + under review). */
  async pipeCvFile(applicationId: string, user: JwtUser, res: Response) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        candidateId: true,
        status: true,
        cvFileKey: true,
        cvMimeType: true,
        job: { select: { createdById: true, closedAt: true } },
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    await this.assertCanAccessApplication(user, app);
    if (!app.cvFileKey) {
      throw new NotFoundException('No CV uploaded for this application.');
    }
    const abs = path.join(this.uploadRoot(), app.cvFileKey);
    try {
      await fs.access(abs);
    } catch {
      throw new NotFoundException(
        'CV file is no longer available (it may have been removed after the job closed).',
      );
    }
    const ext = path.extname(app.cvFileKey) || '';
    const mime = (app.cvMimeType || 'application/octet-stream').toLowerCase();
    const inline = mime.includes('pdf');
    res.set({
      'Content-Type': app.cvMimeType || 'application/octet-stream',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="cv${ext}"`,
    });
    createReadStream(abs).pipe(res);
  }

  private async assertCanAccessApplication(
    user: JwtUser,
    app: {
      id: string;
      candidateId: string;
      status: ApplicationStatus;
      job: { createdById: string; closedAt: Date | null };
    },
  ) {
    if (user.role === UserRole.EVALUATOR) {
      const row = await this.prisma.applicationEvaluator.findUnique({
        where: {
          applicationId_evaluatorId: {
            applicationId: app.id,
            evaluatorId: user.userId,
          },
        },
      });
      if (!row) {
        throw new ForbiddenException(
          'You are not assigned to this application.',
        );
      }
      if (app.status !== ApplicationStatus.UNDER_REVIEW) {
        throw new ForbiddenException(
          'This application is not open for evaluator review.',
        );
      }
      return;
    }
    if (user.role === UserRole.CANDIDATE && app.candidateId !== user.userId) {
      throw new ForbiddenException();
    }
    if (user.role === UserRole.HR && app.job.createdById !== user.userId) {
      throw new ForbiddenException();
    }
  }

  async submitEvaluatorReview(
    applicationId: string,
    user: JwtUser,
    dto: SubmitEvaluatorReviewDto,
  ) {
    if (user.role !== UserRole.EVALUATOR) {
      throw new ForbiddenException();
    }
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    const row = await this.prisma.applicationEvaluator.findUnique({
      where: {
        applicationId_evaluatorId: {
          applicationId,
          evaluatorId: user.userId,
        },
      },
    });
    if (!row) {
      throw new ForbiddenException(
        'You are not assigned to this application.',
      );
    }
    if (app.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'You can only submit a review while the application is under review.',
      );
    }
    const summary = dto.summary?.trim() ?? '';
    return this.prisma.applicationEvaluator.update({
      where: {
        applicationId_evaluatorId: {
          applicationId,
          evaluatorId: user.userId,
        },
      },
      data: {
        passForNextPhase: dto.passForNextPhase,
        reviewSummary: summary.length > 0 ? summary : null,
        reviewSubmittedAt: new Date(),
        status: ApplicationEvaluatorStatus.COMPLETED,
      },
      include: {
        evaluator: { select: { id: true, email: true, name: true } },
      },
    });
  }

  /** HR releases application to assigned evaluators; sets sentToEvaluatorsAt. */
  async sendToEvaluators(applicationId: string, hrUserId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { select: { email: true, name: true } },
        tests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { result: true },
        },
        evaluatorAssignments: {
          include: { evaluator: { select: { email: true } } },
        },
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }

    const test = app.tests[0];
    if (!test) {
      throw new BadRequestException(
        'No technical assessment found for this application.',
      );
    }

    await this.tests.tryHrGradeIfMissingResult(test.id, hrUserId);
    await this.tests.repairSubmittedConsistencyForTest(test.id);

    const graded = await this.prisma.test.findUnique({
      where: { id: test.id },
      include: { result: true },
    });
    if (!graded?.result) {
      throw new BadRequestException(
        'Could not produce a graded result. The candidate may need to answer or submit the test first.',
      );
    }

    const statusRow = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true },
    });
    if (
      statusRow?.status !== ApplicationStatus.GRADED &&
      statusRow?.status !== ApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Send to evaluators is only available after grading completes (application must be graded or under review).',
      );
    }

    const testState = await this.prisma.test.findUnique({
      where: { id: graded.id },
      select: { status: true },
    });
    if (testState?.status !== TestStatus.GRADED || !graded.result) {
      throw new BadRequestException(
        'The assessment must be fully graded before sending to evaluators.',
      );
    }

    if (app.evaluatorAssignments.length === 0) {
      throw new BadRequestException(
        'Assign at least one evaluator to this application before sending to evaluators.',
      );
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        sentToEvaluatorsAt: new Date(),
        status: ApplicationStatus.UNDER_REVIEW,
      },
    });
  }

  /** HR retries CV parse + JD match after a failed or stuck AI run (job owner only). */
  async retryCvAiByHr(applicationId: string, hrUserId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (!this.ai.canUseAi()) {
      throw new BadRequestException(
        'OPENAI_API_KEY is not configured. Add it to backend/.env to run CV/JD analysis.',
      );
    }
    const cvText = app.cvText?.trim() ?? '';
    if (!cvText.length) {
      throw new BadRequestException(
        'No CV text is stored for this application. The candidate may need to re-apply with a readable CV.',
      );
    }
    if (app.aiStatus === AiProcessingStatus.PENDING) {
      const pendingAgeMs = Date.now() - app.updatedAt.getTime();
      const stuckThresholdMs = 5 * 60 * 1000;
      if (pendingAgeMs < stuckThresholdMs) {
        throw new BadRequestException(
          'CV/JD analysis is already in progress. Wait a few minutes or try again if it appears stuck.',
        );
      }
    }
    if (
      app.aiStatus === AiProcessingStatus.COMPLETED &&
      app.matchResult != null
    ) {
      throw new BadRequestException(
        'CV/JD analysis already completed. Refresh the page to view match results.',
      );
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { aiStatus: AiProcessingStatus.PENDING },
    });
    this.scheduleCvAiProcessing(applicationId);

    return this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { select: { id: true, email: true, name: true } },
        tests: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            result: true,
            testSections: {
              orderBy: { orderIndex: 'asc' },
              select: {
                orderIndex: true,
                _count: { select: { questions: true } },
              },
            },
          },
        },
        evaluatorAssignments: {
          include: {
            evaluator: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
  }

  /** HR closes the application as rejected (job owner only). */
  async hrRejectApplication(applicationId: string, hrUserId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (app.status === ApplicationStatus.REJECTED) {
      return app;
    }
    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REJECTED,
        rejectionReason: ApplicationRejectionReason.HR_MANUAL,
      },
    });
  }

  /** HR advances Under review → Interview (job owner only). */
  async hrMoveApplicationToInterview(applicationId: string, hrUserId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (app.job.createdById !== hrUserId) {
      throw new ForbiddenException();
    }
    if (app.status === ApplicationStatus.INTERVIEW) {
      return app;
    }
    if (app.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Only applications under review can move to the interview phase.',
      );
    }
    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.INTERVIEW },
    });
  }
}
