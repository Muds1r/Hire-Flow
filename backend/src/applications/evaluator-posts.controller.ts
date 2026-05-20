import { Body, Controller, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EvaluatorPostsService } from './evaluator-posts.service';
import { UpdateEvaluatorPostDto } from './dto/update-evaluator-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@Controller('evaluator-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EVALUATOR)
export class EvaluatorPostsController {
  constructor(private evaluatorPosts: EvaluatorPostsService) {}

  @Delete(':postId')
  deletePost(@Param('postId') postId: string, @CurrentUser() user: JwtUser) {
    return this.evaluatorPosts.deleteOwnPost(postId, user.userId);
  }

  @Patch(':postId')
  updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdateEvaluatorPostDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.evaluatorPosts.updateOwnPost(postId, user.userId, dto);
  }
}
