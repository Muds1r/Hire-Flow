import { BadRequestException } from '@nestjs/common';
import { AssessmentBankPrepPhase } from '@prisma/client';
import { TestIntensityLevel } from '../common/test-intensity';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionBankService } from '../tests/question-bank.service';

describe('JobsService.submitConfigByEvaluator', () => {
  let service: JobsService;
  let prisma: {
    jobEvaluator: { findUnique: jest.Mock };
    job: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let bank: { prepareForJob: jest.Mock };

  beforeEach(() => {
    prisma = {
      jobEvaluator: { findUnique: jest.fn().mockResolvedValue({ id: 'je-1' }) },
      job: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    bank = { prepareForJob: jest.fn() };
    service = new JobsService(
      prisma as unknown as PrismaService,
      bank as unknown as QuestionBankService,
    );
  });

  const jobId = 'job-1';
  const evaluatorId = 'ev-1';
  const dto = {
    sections: [{ title: 'JS', intensity: TestIntensityLevel.SOFTWARE_ENGINEER }],
  };

  it('rejects when plan already submitted', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: jobId,
      publishedAt: null,
      closedAt: null,
      evaluatorConfigSubmittedAt: new Date(),
    });

    await expect(
      service.submitConfigByEvaluator(jobId, evaluatorId, dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses updateMany race guard and returns job on success', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: jobId,
      publishedAt: null,
      closedAt: null,
      evaluatorConfigSubmittedAt: null,
    });
    prisma.job.updateMany.mockResolvedValue({ count: 1 });
    prisma.job.findUniqueOrThrow.mockResolvedValue({
      id: jobId,
      evaluatorConfigSubmittedAt: new Date(),
    });

    const result = await service.submitConfigByEvaluator(jobId, evaluatorId, dto);
    expect(prisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: jobId,
          evaluatorConfigSubmittedAt: null,
        }),
        data: expect.objectContaining({
          assessmentBankPrepPhase: AssessmentBankPrepPhase.NOT_STARTED,
        }),
      }),
    );
    expect(result.id).toBe(jobId);
  });

  it('accepts compact intensity + sectionTitles payload', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: jobId,
      publishedAt: null,
      closedAt: null,
      evaluatorConfigSubmittedAt: null,
    });
    prisma.job.updateMany.mockResolvedValue({ count: 1 });
    prisma.job.findUniqueOrThrow.mockResolvedValue({ id: jobId });

    const compactDto = {
      intensity: TestIntensityLevel.SENIOR_DEVELOPER,
      sectionTitles: ['React', 'TypeScript'],
    };

    await service.submitConfigByEvaluator(jobId, evaluatorId, compactDto);
    expect(prisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assessmentSectionConfig: [
            { title: 'React', intensity: TestIntensityLevel.SENIOR_DEVELOPER },
            { title: 'TypeScript', intensity: TestIntensityLevel.SENIOR_DEVELOPER },
          ],
        }),
      }),
    );
  });

  it('rejects when updateMany loses race', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: jobId,
      publishedAt: null,
      closedAt: null,
      evaluatorConfigSubmittedAt: null,
    });
    prisma.job.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.submitConfigByEvaluator(jobId, evaluatorId, dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
