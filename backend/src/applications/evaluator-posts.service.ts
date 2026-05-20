import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { CreateEvaluatorPostDto } from './dto/create-evaluator-post.dto';
import { UpdateEvaluatorPostDto } from './dto/update-evaluator-post.dto';

@Injectable()
export class EvaluatorPostsService {
  constructor(private prisma: PrismaService) {}

  private async assertAssignedEvaluator(
    applicationId: string,
    evaluatorId: string,
  ) {
    const row = await this.prisma.applicationEvaluator.findUnique({
      where: {
        applicationId_evaluatorId: { applicationId, evaluatorId },
      },
    });
    if (!row) {
      throw new ForbiddenException(
        'You are not assigned to this application.',
      );
    }
  }

  private async loadApplicationForAccess(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    return app;
  }

  async listForApplication(applicationId: string, user: JwtUser) {
    const app = await this.loadApplicationForAccess(applicationId);
    if (user.role === UserRole.HR) {
      if (app.job.createdById !== user.userId) {
        throw new ForbiddenException();
      }
    } else if (user.role === UserRole.EVALUATOR) {
      await this.assertAssignedEvaluator(applicationId, user.userId);
    } else {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.evaluatorPost.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: {
        evaluator: { select: { id: true, email: true, name: true } },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      applicationId: p.applicationId,
      evaluatorId: p.evaluatorId,
      sectionTitle: p.sectionTitle,
      comment: p.comment,
      createdAt: p.createdAt,
      evaluator: p.evaluator,
    }));
  }

  async create(applicationId: string, user: JwtUser, dto: CreateEvaluatorPostDto) {
    if (user.role !== UserRole.EVALUATOR) {
      throw new ForbiddenException();
    }
    const app = await this.loadApplicationForAccess(applicationId);
    await this.assertAssignedEvaluator(applicationId, user.userId);
    if (app.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new ForbiddenException(
        'You can only add notes while the application is under review.',
      );
    }
    const created = await this.prisma.evaluatorPost.create({
      data: {
        applicationId,
        evaluatorId: user.userId,
        sectionTitle: dto.sectionTitle.trim(),
        comment: dto.comment.trim(),
      },
      include: {
        evaluator: { select: { id: true, email: true, name: true } },
      },
    });
    return {
      id: created.id,
      applicationId: created.applicationId,
      evaluatorId: created.evaluatorId,
      sectionTitle: created.sectionTitle,
      comment: created.comment,
      createdAt: created.createdAt,
      evaluator: created.evaluator,
    };
  }

  async deleteOwnPost(postId: string, evaluatorUserId: string) {
    const post = await this.prisma.evaluatorPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.evaluatorId !== evaluatorUserId) {
      throw new ForbiddenException('You can only delete your own posts.');
    }
    await this.prisma.evaluatorPost.delete({ where: { id: postId } });
    return { ok: true };
  }

  async updateOwnPost(
    postId: string,
    evaluatorUserId: string,
    dto: UpdateEvaluatorPostDto,
  ) {
    const post = await this.prisma.evaluatorPost.findUnique({
      where: { id: postId },
      include: { application: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.evaluatorId !== evaluatorUserId) {
      throw new ForbiddenException('You can only edit your own posts.');
    }
    if (post.application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new ForbiddenException(
        'Posts can only be edited while the application is under review.',
      );
    }
    const comment = dto.comment?.trim();
    if (!comment) {
      throw new BadRequestException('Comment is required to update a note.');
    }
    return this.prisma.evaluatorPost.update({
      where: { id: postId },
      data: { comment },
      include: {
        evaluator: { select: { id: true, email: true, name: true } },
      },
    });
  }
}
