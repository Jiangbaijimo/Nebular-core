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
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto } from './dto/blog.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.BLOG })
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @CurrentUser() user: User,
  ) {
    return this.blogService.create(createBlogDto, user);
  }

  @Public()
  @Get()
  async findAll(@Query() query: BlogQueryDto) {
    // 公开接口只显示已发布的博客
    if (!query.status) {
      query.status = 'PUBLISHED' as any;
    }
    return this.blogService.findAll(query);
  }

  @Get('admin')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async findAllForAdmin(@Query() query: BlogQueryDto) {
    // 管理员接口可以查看所有状态的博客
    return this.blogService.findAll(query);
  }

  @Get('my')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async findMyBlogs(
    @Query() query: BlogQueryDto,
    @CurrentUser() user: User,
  ) {
    query.authorId = user.id;
    return this.blogService.findAll(query);
  }

  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.BLOG })
  async getStats() {
    return this.blogService.getStats();
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const blog = await this.blogService.findOne(id);
    // 增加浏览量
    await this.blogService.incrementViewCount(id);
    return blog;
  }

  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.BLOG })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user: User,
  ) {
    return this.blogService.update(id, updateBlogDto, user);
  }

  @Post(':id/like')
  async likeBlog(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.incrementLikeCount(id);
    return { message: '点赞成功' };
  }

  @Delete(':id/like')
  async unlikeBlog(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.decrementLikeCount(id);
    return { message: '取消点赞成功' };
  }

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