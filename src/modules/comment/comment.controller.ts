import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  ChangeCommentStatusDto,
} from './dto/comment.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { CommentStatus } from './entities/comment.entity';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.COMMENT })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    return this.commentService.create(createCommentDto, user, ip, userAgent);
  }

  @Get()
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findAll(@Query() query: CommentQueryDto) {
    return this.commentService.findAll(query);
  }

  @Public()
  @Get('blog/:blogId')
  async findByBlog(
    @Param('blogId', ParseIntPipe) blogId: number,
    @Query('includeChildren') includeChildren?: string,
  ) {
    const includeChild = includeChildren === 'true';
    return this.commentService.findByBlog(blogId, includeChild);
  }

  @Get('my')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findMyComments(
    @Query() query: CommentQueryDto,
    @CurrentUser() user: User,
  ) {
    query.authorId = user.id;
    return this.commentService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async getStats() {
    return this.commentService.getStats();
  }

  @Get(':id')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.update(id, updateCommentDto, user);
  }

  @Patch(':id/status')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeCommentStatusDto: ChangeCommentStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.changeStatus(
      id,
      changeCommentStatusDto.status,
      user,
    );
  }

  @Post(':id/approve')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.changeStatus(id, CommentStatus.APPROVED, user);
  }

  @Post(':id/reject')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.changeStatus(id, CommentStatus.REJECTED, user);
  }

  @Post(':id/like')
  async likeComment(@Param('id', ParseIntPipe) id: number) {
    await this.commentService.incrementLikeCount(id);
    return { message: '点赞成功' };
  }

  @Delete(':id/like')
  async unlikeComment(@Param('id', ParseIntPipe) id: number) {
    await this.commentService.decrementLikeCount(id);
    return { message: '取消点赞成功' };
  }

  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.COMMENT })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.commentService.remove(id, user);
    return { message: '删除成功' };
  }
}