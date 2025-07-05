import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsDateString,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogStatus } from '../entities/blog.entity';

export class CreateBlogDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus = BlogStatus.DRAFT;

  @IsOptional()
  @IsBoolean()
  isTop?: boolean = false;

  @IsOptional()
  @IsBoolean()
  allowComment?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    return value;
  })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    }
    return value;
  })
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsBoolean()
  isTop?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComment?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    return value;
  })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    }
    return value;
  })
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}

export class BlogQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return 1;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 1 : parsed;
  })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10, example: 10 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return 10;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 10 : parsed;
  })
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: '博客状态', 
    enum: BlogStatus, 
    example: BlogStatus.PUBLISHED 
  })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiPropertyOptional({ 
    description: '搜索关键词（标题、摘要、内容）', 
    example: 'JavaScript' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: '分类ID', 
    example: 1 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ 
    description: '作者ID', 
    example: 1 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  authorId?: number;

  @ApiPropertyOptional({ 
    description: '标签', 
    example: 'frontend' 
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ 
    description: '排序字段', 
    enum: ['createdAt', 'publishedAt', 'viewCount', 'likeCount'],
    default: 'createdAt',
    example: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount' = 'createdAt';

  @ApiPropertyOptional({ 
    description: '排序方向', 
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}