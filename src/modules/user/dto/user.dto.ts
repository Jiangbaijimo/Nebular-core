import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus, AuthProvider } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  password?: string;

  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少3位' })
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  username?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  @MaxLength(500, { message: '个人简介长度不能超过500位' })
  bio?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: '用户状态无效' })
  status?: UserStatus;

  @IsOptional()
  @IsEnum(AuthProvider, { message: '认证提供商无效' })
  provider?: AuthProvider;

  @IsOptional()
  @IsString({ message: '提供商ID必须是字符串' })
  providerId?: string;

  @IsOptional()
  @IsBoolean({ message: '邮箱验证状态必须是布尔值' })
  emailVerified?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少3位' })
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  username?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: '个人简介必须是字符串' })
  @MaxLength(500, { message: '个人简介长度不能超过500位' })
  bio?: string;
}

export class ChangeUserStatusDto {
  @IsEnum(UserStatus, { message: '用户状态无效' })
  status: UserStatus;
}

export class AssignRoleDto {
  @IsNumber({}, { message: '角色ID必须是数字' })
  roleId: number;
}