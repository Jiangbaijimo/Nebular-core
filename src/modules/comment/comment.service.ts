import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStatus } from './entities/comment.entity';
import { Blog } from '../blog/entities/blog.entity';
import { User } from '../user/entities/user.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
} from './dto/comment.dto';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    author: User,
    ip?: string,
    userAgent?: string,
  ): Promise<Comment> {
    const { blogId, parentId, content } = createCommentDto;

    // 检查博客是否存在且允许评论
    const blog = await this.blogRepository.findOne({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    if (!blog.allowComment) {
      throw new BadRequestException('该博客不允许评论');
    }

    const comment = this.commentRepository.create({
      content,
      author,
      blog,
      ip,
      userAgent,
      status: CommentStatus.APPROVED, // 默认审核通过，可根据需要修改
    });

    // 处理父评论
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        relations: ['blog'],
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.blog.id !== blogId) {
        throw new BadRequestException('父评论与博客不匹配');
      }

      comment.parent = parentComment;
    }

    const savedComment = await this.commentRepository.save(comment);

    // 更新博客评论数
    await this.updateBlogCommentCount(blogId);

    return savedComment;
  }

  async findAll(query: CommentQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      blogId,
      authorId,
      parentId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('comment.replies', 'replies');

    // 状态过滤
    if (status) {
      queryBuilder.andWhere('comment.status = :status', { status });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere('comment.content ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // 博客过滤
    if (blogId) {
      queryBuilder.andWhere('blog.id = :blogId', { blogId });
    }

    // 作者过滤
    if (authorId) {
      queryBuilder.andWhere('author.id = :authorId', { authorId });
    }

    // 父评论过滤
    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('comment.parent IS NULL');
      } else {
        queryBuilder.andWhere('parent.id = :parentId', { parentId });
      }
    }

    // 排序
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByBlog(blogId: number, includeChildren = true) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .where('blog.id = :blogId', { blogId })
      .andWhere('comment.status = :status', { status: CommentStatus.APPROVED })
      .andWhere('comment.parent IS NULL') // 只获取顶级评论
      .orderBy('comment.createdAt', 'DESC');

    if (includeChildren) {
      queryBuilder.leftJoinAndSelect('comment.replies', 'replies')
        .leftJoinAndSelect('replies.author', 'repliesAuthor')
        .addOrderBy('replies.createdAt', 'ASC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'blog', 'parent', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
    user: User,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    // 检查权限（只有作者或管理员可以编辑）
    if (comment.author.id !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('无权限编辑此评论');
    }

    // 普通用户只能编辑内容，不能修改状态
    if (comment.author.id === user.id && !this.isAdmin(user)) {
      const { status, ...allowedData } = updateCommentDto;
      Object.assign(comment, allowedData);
    } else {
      Object.assign(comment, updateCommentDto);
    }

    return this.commentRepository.save(comment);
  }

  async changeStatus(
    id: number,
    status: CommentStatus,
    user: User,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    // 只有管理员可以修改状态
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('无权限修改评论状态');
    }

    comment.status = status;
    const savedComment = await this.commentRepository.save(comment);

    // 更新博客评论数
    await this.updateBlogCommentCount(comment.blog.id);

    return savedComment;
  }

  async remove(id: number, user: User): Promise<void> {
    const comment = await this.findOne(id);

    // 检查权限（只有作者或管理员可以删除）
    if (comment.author.id !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException('无权限删除此评论');
    }

    // 检查是否有子评论
    if (comment.replies && comment.replies.length > 0) {
      throw new BadRequestException('存在回复评论，无法删除');
    }

    const blogId = comment.blog.id;
    await this.commentRepository.remove(comment);

    // 更新博客评论数
    await this.updateBlogCommentCount(blogId);
  }

  async incrementLikeCount(id: number): Promise<void> {
    await this.commentRepository.increment({ id }, 'likeCount', 1);
  }

  async decrementLikeCount(id: number): Promise<void> {
    await this.commentRepository.decrement({ id }, 'likeCount', 1);
  }

  async getStats() {
    const [total, approved, pending, rejected] = await Promise.all([
      this.commentRepository.count(),
      this.commentRepository.count({ where: { status: CommentStatus.APPROVED } }),
      this.commentRepository.count({ where: { status: CommentStatus.PENDING } }),
      this.commentRepository.count({ where: { status: CommentStatus.REJECTED } }),
    ]);

    const totalLikes = await this.commentRepository
      .createQueryBuilder('comment')
      .select('SUM(comment.likeCount)', 'total')
      .getRawOne();

    return {
      total,
      approved,
      pending,
      rejected,
      totalLikes: parseInt(totalLikes.total) || 0,
    };
  }

  private async updateBlogCommentCount(blogId: number): Promise<void> {
    const count = await this.commentRepository.count({
      where: {
        blog: { id: blogId },
        status: CommentStatus.APPROVED,
      },
    });

    await this.blogRepository.update(blogId, { commentCount: count });
  }

  private isAdmin(user: User): boolean {
    return user.roles?.some(role => 
      role.permissions?.some(permission => 
        permission.action === PermissionAction.MANAGE && permission.resource === PermissionResource.COMMENT
      )
    ) || false;
  }
}