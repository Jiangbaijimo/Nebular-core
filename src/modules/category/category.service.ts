import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...categoryData } = createCategoryDto;

    // 生成 slug
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    // 检查 slug 是否唯一
    await this.checkSlugUnique(categoryData.slug);

    // 检查名称是否唯一（同级别下）
    await this.checkNameUnique(categoryData.name, parentId);

    const category = this.categoryRepository.create(categoryData);

    // 处理父分类
    if (parentId) {
      const parent = await this.findOne(parentId);
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  async findAll(query: CategoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      parentId,
      includeChildren = false,
      sortBy = 'sort',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent');

    // 如果需要包含子分类
    if (includeChildren) {
      queryBuilder.leftJoinAndSelect('category.children', 'children');
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 状态过滤
    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    // 父分类过滤
    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        queryBuilder.andWhere('category.parent IS NULL');
      } else {
        queryBuilder.andWhere('category.parent.id = :parentId', { parentId });
      }
    }

    // 排序
    if (sortBy === 'blogCount') {
      queryBuilder.orderBy('category.blogCount', sortOrder);
    } else {
      queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
    }

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTree(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: null, isActive: true },
      relations: ['children'],
      order: { sort: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'blogs'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'blogs'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    const { parentId, ...categoryData } = updateCategoryDto;

    // 检查 slug 唯一性
    if (categoryData.slug && categoryData.slug !== category.slug) {
      await this.checkSlugUnique(categoryData.slug);
    }

    // 检查名称唯一性
    if (categoryData.name && categoryData.name !== category.name) {
      await this.checkNameUnique(
        categoryData.name,
        parentId !== undefined ? parentId : category.parent?.id,
        id,
      );
    }

    // 处理父分类变更
    if (parentId !== undefined) {
      if (parentId === null) {
        category.parent = null;
      } else {
        // 检查是否会形成循环引用
        await this.checkCircularReference(id, parentId);
        const parent = await this.findOne(parentId);
        category.parent = parent;
      }
    }

    Object.assign(category, categoryData);

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);

    // 检查是否有子分类
    if (category.children && category.children.length > 0) {
      throw new BadRequestException('存在子分类，无法删除');
    }

    // 检查是否有关联的博客
    if (category.blogCount > 0) {
      throw new BadRequestException('存在关联的博客，无法删除');
    }

    await this.categoryRepository.remove(category);
  }

  async updateBlogCount(categoryId: number): Promise<void> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.blogs', 'blog')
      .select('COUNT(blog.id)', 'count')
      .where('category.id = :categoryId', { categoryId })
      .getRawOne();

    await this.categoryRepository.update(categoryId, {
      blogCount: parseInt(result.count) || 0,
    });
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.categoryRepository.count(),
      this.categoryRepository.count({ where: { isActive: true } }),
      this.categoryRepository.count({ where: { isActive: false } }),
    ]);

    const topCategories = await this.categoryRepository.find({
      order: { blogCount: 'DESC' },
      take: 5,
    });

    return {
      total,
      active,
      inactive,
      topCategories,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private async checkSlugUnique(slug: string, excludeId?: number): Promise<void> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.slug = :slug', { slug });

    if (excludeId) {
      queryBuilder.andWhere('category.id != :excludeId', { excludeId });
    }

    const existingCategory = await queryBuilder.getOne();

    if (existingCategory) {
      throw new ConflictException('URL 别名已存在');
    }
  }

  private async checkNameUnique(
    name: string,
    parentId?: number,
    excludeId?: number,
  ): Promise<void> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.name = :name', { name });

    if (parentId) {
      queryBuilder.andWhere('category.parent.id = :parentId', { parentId });
    } else {
      queryBuilder.andWhere('category.parent IS NULL');
    }

    if (excludeId) {
      queryBuilder.andWhere('category.id != :excludeId', { excludeId });
    }

    const existingCategory = await queryBuilder.getOne();

    if (existingCategory) {
      throw new ConflictException('同级别下分类名称已存在');
    }
  }

  private async checkCircularReference(
    categoryId: number,
    parentId: number,
  ): Promise<void> {
    if (categoryId === parentId) {
      throw new BadRequestException('不能将自己设为父分类');
    }

    // 检查是否会形成循环引用
    let currentParent = await this.categoryRepository.findOne({
      where: { id: parentId },
      relations: ['parent'],
    });

    while (currentParent) {
      if (currentParent.id === categoryId) {
        throw new BadRequestException('不能形成循环引用');
      }
      currentParent = currentParent.parent;
    }
  }
}