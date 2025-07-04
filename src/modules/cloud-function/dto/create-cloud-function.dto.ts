import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsObject, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CloudFunctionType, CloudFunctionMethod } from '../entities/cloud-function.entity';

export class CreateCloudFunctionDto {
  @ApiProperty({ description: '云函数名称', example: 'theme-config' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '引用名称', example: 'shiro' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  reference: string;

  @ApiPropertyOptional({ description: '描述信息' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: '云函数类型', 
    enum: CloudFunctionType,
    example: CloudFunctionType.JSON 
  })
  @IsEnum(CloudFunctionType)
  type: CloudFunctionType;

  @ApiProperty({ 
    description: '请求方法', 
    enum: CloudFunctionMethod,
    example: CloudFunctionMethod.GET 
  })
  @IsEnum(CloudFunctionMethod)
  method: CloudFunctionMethod;

  @ApiProperty({ description: '云函数内容（JSON数据或函数代码）' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '额外配置信息' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: '是否公开访问', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '超时时间（毫秒）', default: 5000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ description: '自定义响应头' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}