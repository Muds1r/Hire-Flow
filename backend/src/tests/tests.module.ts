import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { QuestionBankService } from './question-bank.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [TestsController],
  providers: [TestsService, QuestionBankService],
  exports: [TestsService, QuestionBankService],
})
export class TestsModule {}
