import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { SubmitAssessmentConfigDto } from './dto/submit-assessment-config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  /** HR-only board: active + closed jobs you created. Must be registered before :id routes. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Get('my/board')
  hrBoard(@CurrentUser() user: JwtUser) {
    return this.jobs.findHrBoard(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Get('my/published')
  hrPublished(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto) {
    return this.jobs.findHrPublishedPaginated(
      user.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Get('my/closed')
  hrClosed(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto) {
    return this.jobs.findHrClosedPaginated(
      user.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Get('my/published/options')
  hrPublishedOptions(@CurrentUser() user: JwtUser) {
    return this.jobs.findHrPublishedOptions(user.userId);
  }

  /** Evaluator: draft JDs awaiting configuration. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EVALUATOR)
  @Get('evaluator/pending')
  evaluatorPending(@CurrentUser() user: JwtUser) {
    return this.jobs.findPendingForEvaluator(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EVALUATOR)
  @Get('evaluator/:id')
  evaluatorJobDetail(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.jobs.findOneForEvaluator(id, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EVALUATOR)
  @Post('evaluator/:id/submit-config')
  evaluatorSubmitConfig(
    @Param('id') id: string,
    @Body() dto: SubmitAssessmentConfigDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.jobs.submitConfigByEvaluator(id, user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Post(':id/publish')
  hrPublish(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.jobs.publishByHr(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.jobs.findOpenJobs();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Get('meta/evaluator-users')
  listEvaluatorUsers() {
    return this.jobs.listEvaluatorUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.jobs.findOneForViewer(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: JwtUser) {
    return this.jobs.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR)
  @Post(':id/close')
  closeJob(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.jobs.closeJob(id, user.userId);
  }

}
