import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  AssignRoleDto,
} from './dto/user.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from './entities/user.entity';
import { UserStatus } from './entities/user.entity';
import { PermissionAction, PermissionResource } from './entities/permission.entity';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '创建用户', description: '创建新用户账户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.USER })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: '获取用户列表', description: '分页获取用户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.USER })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.userService.findAll({
      page,
      limit,
      status,
      search,
    });
  }

  @ApiOperation({ summary: '获取个人信息', description: '获取当前登录用户的个人信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.roles,
    };
  }

  @ApiOperation({ summary: '更新个人信息', description: '更新当前登录用户的个人信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }

  @ApiOperation({ summary: '获取用户统计', description: '获取用户统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.USER })
  async getStats() {
    return this.userService.getStats();
  }

  @ApiOperation({ summary: '获取用户详情', description: '根据ID获取用户详细信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.USER })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @ApiOperation({ summary: '更新用户信息', description: '根据ID更新用户信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: '修改用户状态', description: '修改用户账户状态' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/status')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeUserStatusDto: ChangeUserStatusDto,
  ) {
    return this.userService.changeStatus(id, changeUserStatusDto.status);
  }

  @ApiOperation({ summary: '分配角色', description: '为用户分配角色' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/roles')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.userService.assignRole(id, assignRoleDto.roleId);
  }

  @ApiOperation({ summary: '移除角色', description: '移除用户的角色' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/roles/:roleId')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.userService.removeRole(id, roleId);
  }

  @ApiOperation({ summary: '删除用户', description: '根据ID删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.USER })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}