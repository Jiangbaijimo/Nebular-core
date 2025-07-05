import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettingType } from './entities/system-setting.entity';

@ApiTags('系统管理')
@Controller('system')
@UseGuards(RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @ApiOperation({ summary: '获取所有系统设置', description: '获取所有系统配置项' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Get('settings')
  async getAllSettings() {
    return this.systemService.getAllSettings();
  }

  @ApiOperation({ summary: '获取系统设置', description: '根据键名获取系统配置项' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    const value = await this.systemService.getSetting(key);
    return { key, value };
  }

  @ApiOperation({ summary: '设置系统配置', description: '设置或更新系统配置项' })
  @ApiResponse({ status: 200, description: '设置成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Put('settings/:key')
  async setSetting(
    @Param('key') key: string,
    @Body() body: {
      value: any;
      type?: SettingType;
      description?: string;
    },
  ) {
    await this.systemService.setSetting(
      key,
      body.value,
      body.type || SettingType.STRING,
      body.description,
    );
    return { message: '设置成功' };
  }

  @ApiOperation({ summary: '删除系统设置', description: '删除非系统级配置项' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Delete('settings/:key')
  async deleteSetting(@Param('key') key: string) {
    await this.systemService.deleteSetting(key);
    return { message: '删除成功' };
  }

  @ApiOperation({ summary: '初始化默认设置', description: '初始化系统默认配置项' })
  @ApiResponse({ status: 200, description: '初始化成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  @Post('settings/initialize')
  async initializeDefaultSettings() {
    await this.systemService.initializeDefaultSettings();
    return { message: '默认设置初始化成功' };
  }
}