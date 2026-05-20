import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApplicationRejectionReason,
  ApplicationStatus,
  AssessmentBankPrepPhase,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { SubmitAssessmentConfigDto } from './dto/submit-assessment-config.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { QuestionBankService } from '../tests/question-bank.service';
import {
  parseJobAssessmentSectionConfig,
  sectionTitlesFromConfig,
  type JobSectionConfig,
} from '../tests/job-section-config.util';
import { normalizeSectionTitle } from './section-title.util';
import { paginationArgs, toPaginatedResult } from '../common/pagination.util';
import { DEFAULT_PAGE_SIZE } from '../common/dto/pagination-query.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private bank: QuestionBankService,
  ) {}

  listEvaluatorUsers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.EVALUATOR, isActive: true },
      select: { id: true, email: true, name: true },
      orderBy: { email: 'asc' },
    });
  }

  /** HR: draft JD + assign evaluators (no public post, no bank prep yet). */
  async create(dto: CreateJobDto, hrUserId: string) {
    const uniqueIds = [...new Set(dto.evaluatorIds)];
    const evalUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds }, role: UserRole.EVALUATOR, isActive: true },
      select: { id: true },
    });
    if (evalUsers.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Every id must refer to an existing user with the Evaluator role.',
      );
    }

    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        createdById: hrUserId,
        publishedAt: null,
        assessmentSectionTitles: Prisma.JsonNull,
        assessmentSectionConfig: Prisma.JsonNull,
        assessmentBankReady: false,
        assessmentBankPrepPhase: AssessmentBankPrepPhase.NOT_STARTED,
        jobEvaluators: {
          create: uniqueIds.map((evaluatorId) => ({
            id: randomUUID(),
            evaluatorId,
            assignedById: hrUserId,
          })),
        },
      },
      include: this.jobInclude(),
    });

    return job;
  }

  private buildSectionConfigFromDto(dto: SubmitAssessmentConfigDto): JobSectionConfig[] {
    let config: JobSectionConfig[];

    if (dto.sections?.length) {
      config = [
        ...new Map(
          dto.sections.map((s) => {
            const title = normalizeSectionTitle(s.title);
            return [title, { title, intensity: s.intensity }] as const;
          }),
        ).values(),
      ];
    } else if (dto.intensity && dto.sectionTitles?.length) {
      config = [
        ...new Map(
          dto.sectionTitles.map((raw) => {
            const title = normalizeSectionTitle(raw);
            return [title, { title, intensity: dto.intensity! }] as const;
          }),
        ).values(),
      ];
    } else {
      throw new BadRequestException(
        'Provide sections or both intensity and sectionTitles.',
      );
    }

    if (config.length === 0) {
      throw new BadRequestException('Select at least one assessment section.');
    }
    return config;
  }

  /**
   * Evaluator: submit sections + intensity to HR (first assigned evaluator wins;
   * other assignees can no longer submit or see this JD in their pending list).
   */
  async submitConfigByEvaluator(
    jobId: string,
    evaluatorId: string,
    dto: SubmitAssessmentConfigDto,
  ) {
    await this.assertEvaluatorAssigned(jobId, evaluatorId);

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.publishedAt != null) {
      throw new BadRequestException('This job is already published.');
    }
    if (job.closedAt != null) {
      throw new BadRequestException('This job is closed.');
    }
    if (job.evaluatorConfigSubmittedAt != null) {
      throw new BadRequestException(
        'Another evaluator has already submitted the assessment plan for this job. The first submission is final.',
      );
    }

    const config = this.buildSectionConfigFromDto(dto);
    const titles = sectionTitlesFromConfig(config);
    const submittedAt = new Date();

    const updated = await this.prisma.job.updateMany({
      where: {
        id: jobId,
        evaluatorConfigSubmittedAt: null,
        publishedAt: null,
        closedAt: null,
      },
      data: {
        assessmentSectionConfig: config as Prisma.InputJsonValue,
        assessmentSectionTitles: titles,
        evaluatorConfigSubmittedAt: submittedAt,
        assessmentBankReady: false,
        assessmentBankPrepPhase: AssessmentBankPrepPhase.NOT_STARTED,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Another evaluator has already submitted the assessment plan for this job. The first submission is final.',
      );
    }

    return this.prisma.job.findUniqueOrThrow({
      where: { id: jobId },
      include: this.jobInclude(),
    });
  }

  /** HR: publish job after evaluator submitted plan (starts bank prep). */
  async publishByHr(jobId: string, hrUserId: string) {
    const job = await this.assertHrOwnsJob(jobId, hrUserId);
    if (job.publishedAt != null) {
      throw new BadRequestException('This job is already published.');
    }
    if (job.closedAt != null) {
      throw new BadRequestException('This job is closed.');
    }
    if (job.evaluatorConfigSubmittedAt == null) {
      throw new BadRequestException(
        'Wait for an evaluator to submit the assessment plan before publishing.',
      );
    }

    const config = parseJobAssessmentSectionConfig(job.assessmentSectionConfig);
    if (!config?.length) {
      throw new BadRequestException('Assessment plan is missing on this job.');
    }

    const titles = sectionTitlesFromConfig(config);
    const publishedAt = new Date();

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        publishedAt,
        assessmentSectionTitles: titles,
        assessmentBankReady: false,
        assessmentBankPrepPhase: AssessmentBankPrepPhase.NOT_STARTED,
      },
      include: this.jobInclude(),
    });

    void this.runJobAssessmentPreparation(jobId, config).catch((err) => {
      this.logger.error(
        `Job assessment prep failed for ${jobId}`,
        err instanceof Error ? err.stack : String(err),
      );
    });

    return updated;
  }

  /** Draft JDs assigned to this evaluator that no colleague has submitted yet. */
  async findPendingForEvaluator(evaluatorId: string) {
    return this.prisma.job.findMany({
      where: {
        publishedAt: null,
        evaluatorConfigSubmittedAt: null,
        closedAt: null,
        jobEvaluators: { some: { evaluatorId } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        jobEvaluators: {
          include: {
            evaluator: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
  }

  async findOneForEvaluator(jobId: string, evaluatorId: string) {
    await this.assertEvaluatorAssigned(jobId, evaluatorId);
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: this.jobInclude(),
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  private async assertEvaluatorAssigned(jobId: string, evaluatorId: string) {
    const row = await this.prisma.jobEvaluator.findUnique({
      where: { jobId_evaluatorId: { jobId, evaluatorId } },
    });
    if (!row) {
      throw new ForbiddenException('You are not assigned to this job draft.');
    }
  }

  /** Fill per-topic bank after HR publishes the job. */
  private async runJobAssessmentPreparation(
    jobId: string,
    config: JobSectionConfig[],
  ): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return;
    }

    if (!config.length) {
      this.logger.warn(`runJobAssessmentPreparation: no sections on job ${jobId}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          assessmentBankReady: false,
          assessmentBankPrepPhase: AssessmentBankPrepPhase.FAILED,
        },
      });
      return;
    }

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { assessmentBankPrepPhase: AssessmentBankPrepPhase.FILLING_QUESTIONS },
      });

      for (const section of config) {
        await this.bank.fillSkillBankToTierQuotasForJob({
          canonicalSkill: section.title,
          jobDescription: job.description,
          intensity: section.intensity,
        });
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          assessmentBankReady: true,
          assessmentBankPreparedAt: new Date(),
          assessmentBankPrepPhase: AssessmentBankPrepPhase.READY,
        },
      });
    } catch (e) {
      this.logger.error(
        `runJobAssessmentPreparation failed for ${jobId}`,
        e instanceof Error ? e.stack : String(e),
      );
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          assessmentBankReady: false,
          assessmentBankPrepPhase: AssessmentBankPrepPhase.FAILED,
        },
      });
    }
  }

  /** Published open listings (candidates and public browse). */
  findOpenJobs() {
    return this.prisma.job.findMany({
      where: { closedAt: null, publishedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  /** HR desk: draft buckets + totals (published/closed are paginated separately). */
  async findHrBoard(hrUserId: string) {
    const draftWhere = {
      createdById: hrUserId,
      closedAt: null,
      publishedAt: null,
    };
    const include = {
      ...this.jobInclude(),
      _count: { select: { applications: true } },
    } as const;

    const [pendingEvaluator, readyToPublish, publishedTotal, closedTotal, bankPrepInProgress] =
      await Promise.all([
        this.prisma.job.findMany({
          where: { ...draftWhere, evaluatorConfigSubmittedAt: null },
          orderBy: { createdAt: 'desc' },
          include,
        }),
        this.prisma.job.findMany({
          where: { ...draftWhere, evaluatorConfigSubmittedAt: { not: null } },
          orderBy: { createdAt: 'desc' },
          include,
        }),
        this.prisma.job.count({
          where: {
            createdById: hrUserId,
            closedAt: null,
            publishedAt: { not: null },
          },
        }),
        this.prisma.job.count({
          where: { createdById: hrUserId, closedAt: { not: null } },
        }),
        this.prisma.job.count({
          where: {
            createdById: hrUserId,
            closedAt: null,
            publishedAt: { not: null },
            assessmentBankPrepPhase: AssessmentBankPrepPhase.FILLING_QUESTIONS,
          },
        }),
      ]);

    return {
      pendingEvaluator,
      readyToPublish,
      publishedTotal,
      closedTotal,
      bankPrepInProgress: bankPrepInProgress > 0,
    };
  }

  /** HR pipeline / job picker: all open published jobs (id + title), newest first. */
  findHrPublishedOptions(hrUserId: string) {
    return this.prisma.job.findMany({
      where: {
        createdById: hrUserId,
        closedAt: null,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        assessmentBankPrepPhase: true,
        assessmentBankReady: true,
        assessmentBankPreparedAt: true,
        closedAt: true,
        evaluatorConfigSubmittedAt: true,
        assessmentSectionTitles: true,
        assessmentSectionConfig: true,
      },
    });
  }

  /** HR: live published jobs, newest first. */
  findHrPublishedPaginated(hrUserId: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
    const { page: p, limit: l, skip } = paginationArgs(page, limit);
    const where = {
      createdById: hrUserId,
      closedAt: null,
      publishedAt: { not: null },
    };
    const include = {
      ...this.jobInclude(),
      _count: { select: { applications: true } },
    } as const;

    return Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: l,
        include,
      }),
    ]).then(([total, items]) => toPaginatedResult(items, total, p, l));
  }

  /** HR: closed jobs archive, most recently closed first. */
  findHrClosedPaginated(hrUserId: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
    const { page: p, limit: l, skip } = paginationArgs(page, limit);
    const where = { createdById: hrUserId, closedAt: { not: null } };
    const include = {
      ...this.jobInclude(),
      _count: { select: { applications: true } },
    } as const;

    return Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { closedAt: 'desc' },
        skip,
        take: l,
        include,
      }),
    ]).then(([total, items]) => toPaginatedResult(items, total, p, l));
  }

  async findOneForViewer(id: string, user: JwtUser) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: this.jobInclude(),
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.closedAt != null) {
      if (user.role === UserRole.HR && job.createdById === user.userId) {
        return job;
      }
      if (user.role === UserRole.EVALUATOR) {
        const assigned =
          (await this.prisma.jobEvaluator.count({
            where: { jobId: id, evaluatorId: user.userId },
          })) > 0;
        if (assigned) {
          return job;
        }
      }
      throw new NotFoundException('Job not found');
    }

    if (job.publishedAt == null) {
      if (user.role === UserRole.HR && job.createdById === user.userId) {
        return job;
      }
      if (user.role === UserRole.EVALUATOR) {
        const assigned =
          (await this.prisma.jobEvaluator.count({
            where: { jobId: id, evaluatorId: user.userId },
          })) > 0;
        if (assigned) {
          return job;
        }
      }
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async closeJob(jobId: string, hrUserId: string) {
    const job = await this.assertHrOwnsJob(jobId, hrUserId);
    if (job.closedAt != null) {
      return job;
    }
    const closedAt = new Date();
    const cleanupScheduledAt = new Date(closedAt);
    cleanupScheduledAt.setDate(cleanupScheduledAt.getDate() + 7);

    const protectedStatuses: ApplicationStatus[] = [
      ApplicationStatus.HIRED,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.REJECTED,
    ];

    const [rejectResult, updatedJob] = await this.prisma.$transaction([
      this.prisma.application.updateMany({
        where: {
          jobId,
          status: { notIn: protectedStatuses },
        },
        data: {
          status: ApplicationStatus.REJECTED,
          rejectionReason: ApplicationRejectionReason.JOB_CLOSED,
        },
      }),
      this.prisma.job.update({
        where: { id: jobId },
        data: {
          closedAt,
          cleanupEligible: true,
          cleanupScheduledAt,
        },
        include: this.jobInclude(),
      }),
    ]);

    if (rejectResult.count > 0) {
      this.logger.log(
        `closeJob ${jobId}: auto-rejected ${rejectResult.count} application(s); kept HIRED/INTERVIEW/REJECTED`,
      );
    }

    return updatedJob;
  }

  async assertHrOwnsJob(jobId: string, hrUserId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.createdById !== hrUserId) {
      throw new ForbiddenException('You can only manage your own jobs');
    }
    return job;
  }

  private jobInclude() {
    return {
      createdBy: { select: { id: true, name: true, email: true } },
      jobEvaluators: {
        include: {
          evaluator: { select: { id: true, email: true, name: true } },
        },
      },
    } as const;
  }
}
