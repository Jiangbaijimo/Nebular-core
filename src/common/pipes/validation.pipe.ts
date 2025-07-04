import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    // 如果没有元类型或者不需要验证，直接返回原值
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    
    // 跳过自定义装饰器的验证（如 @CurrentUser()）
    if (type === 'custom') {
      return value;
    }
    
    // 如果是查询参数、路径参数，且值为 undefined，直接返回
    if ((type === 'query' || type === 'param') && value === undefined) {
      return value;
    }
    
    // 如果值为 null 或 undefined，且不是请求体，直接返回
    if ((value === null || value === undefined) && type !== 'body') {
      return value;
    }
    
    try {
      const object = plainToClass(metatype, value);
      const errors = await validate(object);
      
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        });
        throw new BadRequestException(`数据验证失败: ${errorMessages.join('; ')}`);
      }
      
      return object;
    } catch (error) {
      // 如果是验证错误，重新抛出
      if (error instanceof BadRequestException) {
        throw error;
      }
      // 如果是其他错误（如类型转换错误），返回原值
      return value;
    }
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}