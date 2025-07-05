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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto } from './dto/blog.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@ApiTags('博客管理')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @ApiOperation({ summary: '创建博客', description: '创建新的博客文章' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.BLOG })
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @CurrentUser() user: User,
  ) {
    return this.blogService.create(createBlogDto, user);
  }

  @ApiOperation({ 
    summary: '获取博客列表', 
    description: '获取已发布的博客列表（公开接口）\n\n支持的查询参数：\n- page: 页码（默认1）\n- limit: 每页数量（默认10）\n- search: 搜索关键词（标题、摘要、内容）\n- categoryId: 分类ID\n- tag: 标签\n- sortBy: 排序字段（createdAt, publishedAt, viewCount, likeCount）\n- sortOrder: 排序方向（ASC, DESC）\n\n示例：\n- /api/blogs?page=1&limit=10\n- /api/blogs?categoryId=1&page=1\n- /api/blogs?search=JavaScript&sortBy=viewCount&sortOrder=DESC' 
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Public()
  @Get()
  async findAll(@Query() query: BlogQueryDto) {
    // 公开接口只显示已发布的博客
    if (!query.status) {
      query.status = 'PUBLISHED' as any;
    }
    return this.blogService.findAll(query);
  }

  @ApiOperation({ summary: '管理员获取博客列表', description: '管理员获取所有状态的博客列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('admin')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async findAllForAdmin(@Query() query: BlogQueryDto) {
    // 管理员接口可以查看所有状态的博客
    return this.blogService.findAll(query);
  }

  @ApiOperation({ summary: '获取我的博客', description: '获取当前用户的博客列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get('my')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async findMyBlogs(
    @Query() query: BlogQueryDto,
    @CurrentUser() user: User,
  ) {
    query.authorId = user.id;
    return this.blogService.findAll(query);
  }

  @ApiOperation({ summary: '获取博客统计', description: '获取博客相关统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async getStats() {
    return this.blogService.getStats();
  }

  @ApiOperation({ summary: '通过别名获取博客', description: '通过博客别名获取博客详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @ApiOperation({ summary: '获取博客详情', description: '通过ID获取博客详情并增加浏览量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const blog = await this.blogService.findOne(id);
    // 增加浏览量
    await this.blogService.incrementViewCount(id);
    return blog;
  }

  @ApiOperation({ summary: '更新博客', description: '更新指定博客的信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.BLOG })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user: User,
  ) {
    return this.blogService.update(id, updateBlogDto, user);
  }

  @ApiOperation({ summary: '点赞博客', description: '为指定博客点赞' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @Post(':id/like')
  async likeBlog(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.incrementLikeCount(id);
    return { message: '点赞成功' };
  }

  @ApiOperation({ summary: '取消点赞', description: '取消对指定博客的点赞' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @Delete(':id/like')
  async unlikeBlog(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.decrementLikeCount(id);
    return { message: '取消点赞成功' };
  }

  @ApiOperation({ summary: '删除博客', description: '删除指定的博客' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '博客不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.BLOG })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.blogService.remove(id, user);
    return { message: '删除成功' };
  }
}