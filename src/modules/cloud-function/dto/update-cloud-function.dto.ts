import { PartialType } from '@nestjs/swagger';
import { CreateCloudFunctionDto } from './create-cloud-function.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CloudFunctionStatus } from '../entities/cloud-function.entity';

export class UpdateCloudFunctionDto extends PartialType(CreateCloudFunctionDto) {
  @ApiPropertyOptional({ 
    description: '云函数状态', 
    enum: CloudFunctionStatus 
  })
  @IsOptional()
  @IsEnum(CloudFunctionStatus)
  status?: CloudFunctionStatus;
}