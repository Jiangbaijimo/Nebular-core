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

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.USER })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

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

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }

  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.USER })
  async getStats() {
    return this.userService.getStats();
  }

  @Get(':id')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.USER })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeUserStatusDto: ChangeUserStatusDto,
  ) {
    return this.userService.changeStatus(id, changeUserStatusDto.status);
  }

  @Post(':id/roles')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.userService.assignRole(id, assignRoleDto.roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.USER })
  async removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.userService.removeRole(id, roleId);
  }

  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.USER })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}