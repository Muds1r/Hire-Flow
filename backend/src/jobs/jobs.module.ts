import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestsModule } from '../tests/tests.module';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobCleanupService } from './job-cleanup.service';

@Module({
  imports: [PrismaModule, TestsModule],
  controllers: [JobsController],
  providers: [JobsService, JobCleanupService],
  exports: [JobsService],
})
export class JobsModule {}
