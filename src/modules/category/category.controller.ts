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
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.CATEGORY })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Public()
  @Get()
  async findAll(@Query() query: CategoryQueryDto) {
    // 公开接口只显示激活的分类
    if (query.isActive === undefined) {
      query.isActive = true;
    }
    return this.categoryService.findAll(query);
  }

  @Get('admin')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CATEGORY })
  async findAllForAdmin(@Query() query: CategoryQueryDto) {
    // 管理员接口可以查看所有状态的分类
    return this.categoryService.findAll(query);
  }

  @Public()
  @Get('tree')
  async findTree() {
    return this.categoryService.findTree();
  }

  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CATEGORY })
  async getStats() {
    return this.categoryService.getStats();
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CATEGORY })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Patch(':id/blog-count')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CATEGORY })
  async updateBlogCount(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.updateBlogCount(id);
    return { message: '博客数量更新成功' };
  }

  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.CATEGORY })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return { message: '删除成功' };
  }
}