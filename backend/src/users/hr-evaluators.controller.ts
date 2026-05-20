import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEvaluatorDto } from './dto/create-evaluator.dto';
import { UpdateEvaluatorDto } from './dto/update-evaluator.dto';
import { HrEvaluatorsService } from './hr-evaluators.service';

@Controller('hr/evaluators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HR)
export class HrEvaluatorsController {
  constructor(private evaluators: HrEvaluatorsService) {}

  @Get()
  list() {
    return this.evaluators.listForHr();
  }

  @Post()
  create(@Body() dto: CreateEvaluatorDto) {
    return this.evaluators.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEvaluatorDto) {
    return this.evaluators.update(id, dto);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.evaluators.setActive(id, false);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.evaluators.setActive(id, true);
  }
}
