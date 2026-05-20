import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HrEvaluatorsController } from './hr-evaluators.controller';
import { HrEvaluatorsService } from './hr-evaluators.service';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [HrEvaluatorsController],
  providers: [UsersService, HrEvaluatorsService],
  exports: [UsersService],
})
export class UsersModule {}
