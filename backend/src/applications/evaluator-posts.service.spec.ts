import { ForbiddenException } from '@nestjs/common';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { EvaluatorPostsService } from './evaluator-posts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EvaluatorPostsService', () => {
  const applicationId = 'app-1';
  const hrUser = { userId: 'hr-1', role: UserRole.HR, email: 'hr@test.com' };
  const evalUser = { userId: 'ev-1', role: UserRole.EVALUATOR, email: 'ev@test.com' };

  let service: EvaluatorPostsService;
  let prisma: {
    application: { findUnique: jest.Mock };
    applicationEvaluator: { findUnique: jest.Mock };
    evaluatorPost: { findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      application: { findUnique: jest.fn() },
      applicationEvaluator: { findUnique: jest.fn() },
      evaluatorPost: { findMany: jest.fn(), create: jest.fn() },
    };
    service = new EvaluatorPostsService(prisma as unknown as PrismaService);
  });

  const appUnderReview = {
    id: applicationId,
    status: ApplicationStatus.UNDER_REVIEW,
    job: { createdById: 'hr-1' },
  };

  it('allows HR to list posts for own job', async () => {
    prisma.application.findUnique.mockResolvedValue(appUnderReview);
    prisma.evaluatorPost.findMany.mockResolvedValue([
      {
        id: 'p1',
        applicationId,
        evaluatorId: 'ev-1',
        sectionTitle: 'JS',
        title: '',
        comment: 'note',
        createdAt: new Date(),
        evaluator: { id: 'ev-1', email: 'ev@test.com', name: null },
      },
    ]);

    const rows = await service.listForApplication(applicationId, hrUser);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sectionTitle: 'JS', comment: 'note' });
    expect(rows[0]).not.toHaveProperty('title');
  });

  it('allows assigned evaluator to list posts after interview', async () => {
    prisma.application.findUnique.mockResolvedValue({
      ...appUnderReview,
      status: ApplicationStatus.INTERVIEW,
    });
    prisma.applicationEvaluator.findUnique.mockResolvedValue({ id: 'assign-1' });
    prisma.evaluatorPost.findMany.mockResolvedValue([]);

    await expect(
      service.listForApplication(applicationId, evalUser),
    ).resolves.toEqual([]);
  });

  it('blocks evaluator create when not under review', async () => {
    prisma.application.findUnique.mockResolvedValue({
      ...appUnderReview,
      status: ApplicationStatus.INTERVIEW,
    });
    prisma.applicationEvaluator.findUnique.mockResolvedValue({ id: 'assign-1' });

    await expect(
      service.create(applicationId, evalUser, {
        sectionTitle: 'JS',
        comment: 'hello',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates post with sectionTitle while under review', async () => {
    prisma.application.findUnique.mockResolvedValue(appUnderReview);
    prisma.applicationEvaluator.findUnique.mockResolvedValue({ id: 'assign-1' });
    prisma.evaluatorPost.create.mockResolvedValue({
      id: 'p1',
      applicationId,
      evaluatorId: 'ev-1',
      sectionTitle: 'JS',
      comment: 'hello',
      createdAt: new Date(),
      evaluator: { id: 'ev-1', email: 'ev@test.com', name: null },
    });

    const row = await service.create(applicationId, evalUser, {
      sectionTitle: 'JS',
      comment: 'hello',
    });
    expect(prisma.evaluatorPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sectionTitle: 'JS',
          comment: 'hello',
        }),
      }),
    );
    expect(row.sectionTitle).toBe('JS');
  });
});
