import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Deletes uploaded CV files for closed jobs past `cleanupScheduledAt`. */
@Injectable()
export class JobCleanupService {
  private readonly logger = new Logger(JobCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private uploadRoot() {
    return path.resolve(
      process.cwd(),
      this.config.get<string>('UPLOAD_DIR') ?? 'uploads',
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupStaleJobFiles(): Promise<void> {
    const now = new Date();
    const jobs = await this.prisma.job.findMany({
      where: {
        closedAt: { not: null },
        cleanupScheduledAt: { lte: now },
        cvFilesCleanedAt: null,
      },
      include: {
        applications: {
          select: {
            cvFileKey: true,
          },
        },
      },
    });

    for (const job of jobs) {
      try {
        for (const app of job.applications) {
          if (app.cvFileKey) {
            const abs = path.join(this.uploadRoot(), app.cvFileKey);
            await fs.unlink(abs).catch(() => undefined);
            await this.prisma.application.updateMany({
              where: { cvFileKey: app.cvFileKey },
              data: { cvFileKey: null, cvMimeType: null },
            });
          }
        }
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            cvFilesCleanedAt: new Date(),
            cleanupEligible: false,
          },
        });
        this.logger.log(`CV cleanup completed for job ${job.id}`);
      } catch (e) {
        this.logger.error(
          `CV cleanup failed for job ${job.id}`,
          e instanceof Error ? e.stack : String(e),
        );
      }
    }
  }
}
