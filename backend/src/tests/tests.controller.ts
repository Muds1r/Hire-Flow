import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TestsService } from './tests.service';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class TestsController {
  constructor(private tests: TestsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':id/hr/send')
  hrSend(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.tests.sendTestToCandidate(id, user.userId);
  }

  @Get(':id/candidate')
  getCandidate(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException();
    }
    return this.tests.getCandidatePayload(id, user.userId);
  }

  @Patch(':id/answers')
  saveAnswer(
    @Param('id') id: string,
    @Body() dto: SaveAnswerDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException();
    }
    return this.tests.saveAnswer(id, user.userId, dto);
  }

  @Post(':id/violations')
  violation(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException();
    }
    return this.tests.recordViolation(id, user.userId);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException();
    }
    return this.tests.submitManual(id, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.EVALUATOR)
  @Get(':id/hr')
  hrView(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.tests.getHrResultView(id, user);
  }
}
