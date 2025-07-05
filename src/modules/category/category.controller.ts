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
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@ApiTags('分类管理')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: '创建分类', description: '创建新的博客分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.CATEGORY })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @ApiOperation({ summary: '获取分类列表', description: '获取激活状态的分类列表（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Public()
  @Get()
  async findAll(@Query() query: CategoryQueryDto) {
    // 公开接口只显示激活的分类
    // if (query.isActive === undefined) {
    //   query.isActive = true;
    // }
    return this.categoryService.findAll(query);
  }

  @ApiOperation({ summary: '管理员获取分类列表', description: '管理员获取所有状态的分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('admin')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CATEGORY })
  async findAllForAdmin(@Query() query: CategoryQueryDto) {
    // 管理员接口可以查看所有状态的分类
    return this.categoryService.findAll(query);
  }

  @ApiOperation({ summary: '获取分类树', description: '获取分类的树形结构（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Public()
  @Get('tree')
  async findTree() {
    return this.categoryService.findTree();
  }

  @ApiOperation({ summary: '获取分类统计', description: '获取分类统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CATEGORY })
  async getStats() {
    return this.categoryService.getStats();
  }

  @ApiOperation({ summary: '根据别名获取分类', description: '根据别名获取分类详情（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @ApiOperation({ summary: '获取分类详情', description: '根据ID获取分类详情（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @ApiOperation({ summary: '更新分类', description: '更新分类信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CATEGORY })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @ApiOperation({ summary: '更新博客数量', description: '更新分类下的博客数量' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/blog-count')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CATEGORY })
  async updateBlogCount(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.updateBlogCount(id);
    return { message: '博客数量更新成功' };
  }

  @ApiOperation({ summary: '删除分类', description: '删除指定分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.CATEGORY })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return { message: '删除成功' };
  }
}