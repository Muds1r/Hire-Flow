import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { EvaluatorPostsService } from './evaluator-posts.service';
import { AssignEvaluatorsDto } from './dto/assign-evaluators.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateEvaluatorPostDto } from './dto/create-evaluator-post.dto';
import { SubmitEvaluatorReviewDto } from './dto/submit-evaluator-review.dto';
import { TestsService } from '../tests/tests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { HrPipelineQueryDto } from './dto/hr-pipeline-query.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private applications: ApplicationsService,
    private tests: TestsService,
    private evaluatorPosts: EvaluatorPostsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateApplicationDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.createWithCv(user, body.jobId, file);
  }

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.applications.listForUser(user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Get('hr/rejected')
  listHrRejected(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto) {
    return this.applications.listRejectedForHr(
      user.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Get('hr/pipeline')
  listHrPipeline(@CurrentUser() user: JwtUser, @Query() query: HrPipelineQueryDto) {
    return this.applications.listPipelineForHr(user.userId, query.jobId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Get('hr/by-job/:jobId')
  listHrByJob(@Param('jobId') jobId: string, @CurrentUser() user: JwtUser) {
    return this.applications.listByJobForHr(user.userId, jobId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.EVALUATOR)
  @Get(':id/evaluator-posts')
  listEvaluatorPosts(@Param('id') applicationId: string, @CurrentUser() user: JwtUser) {
    return this.evaluatorPosts.listForApplication(applicationId, user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.EVALUATOR)
  @Post(':id/evaluator-posts')
  createEvaluatorPost(
    @Param('id') applicationId: string,
    @Body() dto: CreateEvaluatorPostDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.evaluatorPosts.create(applicationId, user, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR, UserRole.EVALUATOR)
  @Get(':id/cv')
  getCv(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ) {
    return this.applications.pipeCvFile(id, user, res);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.applications.getOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/retry-cv-ai')
  retryCvAi(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.retryCvAiByHr(applicationId, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/tests/generate')
  generateTest(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tests.generateForApplication(applicationId, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/hr-reject')
  hrReject(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.hrRejectApplication(applicationId, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/hr-move-to-interview')
  hrMoveToInterview(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.hrMoveApplicationToInterview(
      applicationId,
      user.userId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/send-to-evaluators')
  sendToEvaluators(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.sendToEvaluators(applicationId, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.HR)
  @Post(':applicationId/evaluators')
  assignEvaluators(
    @Param('applicationId') applicationId: string,
    @Body() dto: AssignEvaluatorsDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.assignEvaluators(
      applicationId,
      user.userId,
      dto.evaluatorIds,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.EVALUATOR)
  @Post(':applicationId/evaluator-review')
  submitEvaluatorReview(
    @Param('applicationId') applicationId: string,
    @Body() dto: SubmitEvaluatorReviewDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.applications.submitEvaluatorReview(applicationId, user, dto);
  }
}
