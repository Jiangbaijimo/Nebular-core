import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CloudFunctionType, CloudFunctionMethod, CloudFunctionStatus } from '../entities/cloud-function.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCloudFunctionDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: '云函数类型', 
    enum: CloudFunctionType 
  })
  @IsOptional()
  @IsEnum(CloudFunctionType)
  type?: CloudFunctionType;

  @ApiPropertyOptional({ 
    description: '请求方法', 
    enum: CloudFunctionMethod 
  })
  @IsOptional()
  @IsEnum(CloudFunctionMethod)
  method?: CloudFunctionMethod;

  @ApiPropertyOptional({ 
    description: '云函数状态', 
    enum: CloudFunctionStatus 
  })
  @IsOptional()
  @IsEnum(CloudFunctionStatus)
  status?: CloudFunctionStatus;

  @ApiPropertyOptional({ description: '是否公开访问' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '作者ID' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  authorId?: number;
}