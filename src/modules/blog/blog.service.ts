import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Blog, BlogStatus } from './entities/blog.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createBlogDto: CreateBlogDto, author: User): Promise<Blog> {
    const { categoryIds, ...blogData } = createBlogDto;

    // 生成 slug
    if (!blogData.slug) {
      blogData.slug = this.generateSlug(blogData.title);
    }

    // 检查 slug 是否唯一
    await this.checkSlugUnique(blogData.slug);

    const blog = this.blogRepository.create({
      ...blogData,
      author,
    });

    // 处理分类关联
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.findByIds(categoryIds);
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('部分分类不存在');
      }
      blog.categories = categories;
    }

    // 如果状态为发布，设置发布时间
    if (blog.status === BlogStatus.PUBLISHED && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    return this.blogRepository.save(blog);
  }

  async findAll(query: BlogQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      categoryId,
      authorId,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.createQueryBuilder()
      .leftJoinAndSelect('blog.author', 'author')
      .leftJoinAndSelect('blog.categories', 'categories');

    // 状态过滤
    if (status) {
      queryBuilder.andWhere('blog.status = :status', { status });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere(
        '(blog.title ILIKE :search OR blog.summary ILIKE :search OR blog.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 分类过滤
    if (categoryId) {
      queryBuilder.andWhere('categories.id = :categoryId', { categoryId });
    }

    // 作者过滤
    if (authorId) {
      queryBuilder.andWhere('author.id = :authorId', { authorId });
    }

    // 标签过滤
    if (tag) {
      queryBuilder.andWhere(':tag = ANY(blog.tags)', { tag });
    }

    // 排序
    queryBuilder.orderBy(`blog.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [blogs, total] = await queryBuilder.getManyAndCount();

    return {
      data: blogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Blog> {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author', 'categories', 'comments'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    return blog;
  }

  async findBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.findOne({
      where: { slug },
      relations: ['author', 'categories', 'comments'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    // 增加浏览量
    await this.incrementViewCount(blog.id);

    return blog;
  }

  async update(
    id: number,
    updateBlogDto: UpdateBlogDto,
    user: User,
  ): Promise<Blog> {
    const blog = await this.findOne(id);

    // 检查权限（只有作者或管理员可以编辑）
    if (blog.author.id !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('无权限编辑此博客');
    }

    const { categoryIds, ...blogData } = updateBlogDto;

    // 检查 slug 唯一性
    if (blogData.slug && blogData.slug !== blog.slug) {
      await this.checkSlugUnique(blogData.slug);
    }

    // 处理分类关联
    if (categoryIds !== undefined) {
      if (categoryIds.length > 0) {
        const categories = await this.categoryRepository.findByIds(categoryIds);
        if (categories.length !== categoryIds.length) {
          throw new BadRequestException('部分分类不存在');
        }
        blog.categories = categories;
      } else {
        blog.categories = [];
      }
    }

    // 如果状态改为发布且之前未发布，设置发布时间
    if (
      blogData.status === BlogStatus.PUBLISHED &&
      blog.status !== BlogStatus.PUBLISHED &&
      !blog.publishedAt
    ) {
      blogData.publishedAt = new Date();
    }

    Object.assign(blog, blogData);

    return this.blogRepository.save(blog);
  }

  async remove(id: number, user: User): Promise<void> {
    const blog = await this.findOne(id);

    // 检查权限（只有作者或管理员可以删除）
    if (blog.author.id !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('无权限删除此博客');
    }

    await this.blogRepository.remove(blog);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.blogRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: number): Promise<void> {
    await this.blogRepository.increment({ id }, 'likeCount', 1);
  }

  async decrementLikeCount(id: number): Promise<void> {
    await this.blogRepository.decrement({ id }, 'likeCount', 1);
  }

  async getStats() {
    const [total, published, draft, archived] = await Promise.all([
      this.blogRepository.count(),
      this.blogRepository.count({ where: { status: BlogStatus.PUBLISHED } }),
      this.blogRepository.count({ where: { status: BlogStatus.DRAFT } }),
      this.blogRepository.count({ where: { status: BlogStatus.ARCHIVED } }),
    ]);

    const totalViews = await this.blogRepository
      .createQueryBuilder('blog')
      .select('SUM(blog.viewCount)', 'total')
      .getRawOne();

    const totalLikes = await this.blogRepository
      .createQueryBuilder('blog')
      .select('SUM(blog.likeCount)', 'total')
      .getRawOne();

    return {
      total,
      published,
      draft,
      archived,
      totalViews: parseInt(totalViews.total) || 0,
      totalLikes: parseInt(totalLikes.total) || 0,
    };
  }

  private createQueryBuilder(): SelectQueryBuilder<Blog> {
    return this.blogRepository.createQueryBuilder('blog');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  private async checkSlugUnique(slug: string): Promise<void> {
    const existingBlog = await this.blogRepository.findOne({
      where: { slug },
    });

    if (existingBlog) {
      throw new BadRequestException('URL 别名已存在');
    }
  }

  private isAdmin(user: User): boolean {
    return user.roles?.some(role => 
      role.permissions?.some(permission => 
        permission.action === 'MANAGE' && permission.resource === 'BLOG'
      )
    ) || false;
  }
}