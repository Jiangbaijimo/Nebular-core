import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FileType, FileStatus } from '../entities/file.entity';

export class UploadFileDto {
  @ApiPropertyOptional({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '文件标签', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return Array.isArray(value) ? value : [];
  })
  tags?: string[];

  @ApiPropertyOptional({ description: '是否生成缩略图（仅图片）', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  generateThumbnail?: boolean = true;
}

export class FileResponseDto {
  @ApiProperty({ description: '文件ID' })
  id: number;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: '存储文件名' })
  filename: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '格式化的文件大小' })
  formattedSize: string;

  @ApiProperty({ description: '文件类型', enum: FileType })
  type: FileType;

  @ApiProperty({ description: '文件状态', enum: FileStatus })
  status: FileStatus;

  @ApiPropertyOptional({ description: '文件元数据' })
  metadata?: any;

  @ApiPropertyOptional({ description: '缩略图URL' })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: '文件描述' })
  description?: string;

  @ApiPropertyOptional({ description: '文件标签' })
  tags?: string[];

  @ApiProperty({ description: '下载次数' })
  downloadCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class FileQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '文件类型', enum: FileType })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @ApiPropertyOptional({ description: '文件状态', enum: FileStatus })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '标签过滤' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: '排序字段', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: '排序方向', default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class UpdateFileDto {
  @ApiPropertyOptional({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '文件标签', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class BatchDeleteDto {
  @ApiProperty({ description: '文件ID列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  fileIds: number[];
}

export class UploadUrlDto {
  @ApiProperty({ description: '文件名' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'MIME类型' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: '文件大小' })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({ description: '文件描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadUrlResponseDto {
  @ApiProperty({ description: '上传URL' })
  uploadUrl: string;

  @ApiProperty({ description: '文件ID' })
  fileId: number;

  @ApiProperty({ description: '上传表单字段' })
  formData: Record<string, string>;

  @ApiProperty({ description: 'URL过期时间' })
  expiresAt: Date;
}