import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Comment } from '../../comment/entities/comment.entity';

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({
    type: 'enum',
    enum: BlogStatus,
    default: BlogStatus.DRAFT,
  })
  status: BlogStatus;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: false })
  isTop: boolean; // 是否置顶

  @Column({ default: true })
  allowComment: boolean; // 是否允许评论

  @Column({ type: 'json', nullable: true })
  tags: string[]; // 标签数组

  @Column({ type: 'json', nullable: true })
  seoKeywords: string[]; // SEO关键词

  @Column({ nullable: true })
  seoDescription: string; // SEO描述

  @Column({ nullable: true })
  publishedAt: Date;

  @ManyToOne(() => User, (user) => user.blogs)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  authorId: number;

  @ManyToMany(() => Category, (category) => category.blogs)
  @JoinTable({
    name: 'blog_categories',
    joinColumn: { name: 'blog_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Comment, (comment) => comment.blog)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}