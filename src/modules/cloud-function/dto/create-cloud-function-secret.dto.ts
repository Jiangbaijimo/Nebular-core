import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCloudFunctionSecretDto {
  @ApiProperty({ description: '密钥名称', example: 'api_key' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  key: string;

  @ApiProperty({ description: '密钥值' })
  @IsString()
  @MinLength(1)
  value: string;

  @ApiPropertyOptional({ description: '密钥描述' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCloudFunctionSecretDto {
  @ApiPropertyOptional({ description: '密钥值' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  value?: string;

  @ApiPropertyOptional({ description: '密钥描述' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}