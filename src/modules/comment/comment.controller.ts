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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ summary: '创建评论', description: '创建新评论' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ summary: '获取评论列表', description: '管理员获取所有评论列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findAll(@Query() query: CommentQueryDto) {
    return this.commentService.findAll(query);
  }

  @ApiOperation({ summary: '获取博客评论', description: '获取指定博客的评论列表（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Public()
  @Get('blog/:blogId')
  async findByBlog(
    @Param('blogId', ParseIntPipe) blogId: number,
    @Query('includeChildren') includeChildren?: string,
  ) {
    const includeChild = includeChildren === 'true';
    return this.commentService.findByBlog(blogId, includeChild);
  }

  @ApiOperation({ summary: '获取我的评论', description: '获取当前用户的评论列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('my')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findMyComments(
    @Query() query: CommentQueryDto,
    @CurrentUser() user: User,
  ) {
    query.authorId = user.id;
    return this.commentService.findAll(query);
  }

  @ApiOperation({ summary: '获取评论统计', description: '获取评论统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async getStats() {
    return this.commentService.getStats();
  }

  @ApiOperation({ summary: '获取评论详情', description: '根据ID获取评论详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.COMMENT })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @ApiOperation({ summary: '更新评论', description: '更新评论内容' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.update(id, updateCommentDto, user);
  }

  @ApiOperation({ summary: '修改评论状态', description: '修改评论的审核状态' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
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

  @ApiOperation({ summary: '审核通过评论', description: '将评论状态设为审核通过' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/approve')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.changeStatus(id, CommentStatus.APPROVED, user);
  }

  @ApiOperation({ summary: '拒绝评论', description: '将评论状态设为拒绝' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/reject')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.commentService.changeStatus(id, CommentStatus.REJECTED, user);
  }

  @ApiOperation({ summary: '点赞评论', description: '为评论点赞' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @Post(':id/like')
  async likeComment(@Param('id', ParseIntPipe) id: number) {
    await this.commentService.incrementLikeCount(id);
    return { message: '点赞成功' };
  }

  @ApiOperation({ summary: '取消点赞评论', description: '取消对评论的点赞' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @Delete(':id/like')
  async unlikeComment(@Param('id', ParseIntPipe) id: number) {
    await this.commentService.decrementLikeCount(id);
    return { message: '取消点赞成功' };
  }

  @ApiOperation({ summary: '删除评论', description: '删除指定评论' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  @ApiBearerAuth('JWT-auth')
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