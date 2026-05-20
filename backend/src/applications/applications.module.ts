import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { EvaluatorPostsService } from './evaluator-posts.service';
import { ApplicationsController } from './applications.controller';
import { EvaluatorPostsController } from './evaluator-posts.controller';
import { CvModule } from '../cv/cv.module';
import { AiModule } from '../ai/ai.module';
import { TestsModule } from '../tests/tests.module';

@Module({
  imports: [CvModule, AiModule, TestsModule],
  controllers: [ApplicationsController, EvaluatorPostsController],
  providers: [ApplicationsService, EvaluatorPostsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
