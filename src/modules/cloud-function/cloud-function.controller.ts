import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  All,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CloudFunctionService } from './cloud-function.service';
import { CreateCloudFunctionDto } from './dto/create-cloud-function.dto';
import { UpdateCloudFunctionDto } from './dto/update-cloud-function.dto';
import { QueryCloudFunctionDto } from './dto/query-cloud-function.dto';
import { CreateCloudFunctionSecretDto, UpdateCloudFunctionSecretDto } from './dto/create-cloud-function-secret.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Request } from 'express';

@ApiTags('云函数管理')
@Controller('cloud-functions')
export class CloudFunctionController {
  constructor(private readonly cloudFunctionService: CloudFunctionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建云函数' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(
    @Body() createCloudFunctionDto: CreateCloudFunctionDto,
    @CurrentUser() user: User,
  ) {
    return await this.cloudFunctionService.create(createCloudFunctionDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取云函数列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: QueryCloudFunctionDto) {
    return await this.cloudFunctionService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取云函数详情' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '云函数不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.cloudFunctionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新云函数' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '云函数不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCloudFunctionDto: UpdateCloudFunctionDto,
    @CurrentUser() user: User,
  ) {
    return await this.cloudFunctionService.update(id, updateCloudFunctionDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除云函数' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '云函数不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.cloudFunctionService.remove(id, user);
    return { message: '删除成功' };
  }

  // 密钥管理

  @Post(':id/secrets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建云函数密钥' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createSecret(
    @Param('id', ParseIntPipe) id: number,
    @Body() createSecretDto: CreateCloudFunctionSecretDto,
    @CurrentUser() user: User,
  ) {
    return await this.cloudFunctionService.createSecret(id, createSecretDto, user);
  }

  @Patch('secrets/:secretId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新云函数密钥' })
  @ApiParam({ name: 'secretId', description: '密钥ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSecret(
    @Param('secretId', ParseIntPipe) secretId: number,
    @Body() updateSecretDto: UpdateCloudFunctionSecretDto,
    @CurrentUser() user: User,
  ) {
    return await this.cloudFunctionService.updateSecret(secretId, updateSecretDto, user);
  }

  @Delete('secrets/:secretId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除云函数密钥' })
  @ApiParam({ name: 'secretId', description: '密钥ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async removeSecret(
    @Param('secretId', ParseIntPipe) secretId: number,
    @CurrentUser() user: User,
  ) {
    await this.cloudFunctionService.removeSecret(secretId, user);
    return { message: '删除成功' };
  }

  // 日志管理

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取云函数日志' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.cloudFunctionService.getLogs(id, page, limit);
  }

  @Delete(':id/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '清理云函数日志' })
  @ApiParam({ name: 'id', description: '云函数ID' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async clearLogs(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.cloudFunctionService.clearLogs(id, user);
    return { message: '日志清理成功' };
  }
}

// 云函数执行控制器（公开访问）
@ApiTags('云函数执行')
@Controller('fn')
export class CloudFunctionExecuteController {
  constructor(private readonly cloudFunctionService: CloudFunctionService) {}

  @All(':reference/*')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行云函数' })
  @ApiParam({ name: 'reference', description: '云函数引用名称' })
  @ApiResponse({ status: 200, description: '执行成功' })
  @ApiResponse({ status: 400, description: '请求错误' })
  @ApiResponse({ status: 404, description: '云函数不存在' })
  @ApiResponse({ status: 500, description: '执行失败' })
  async execute(
    @Param('reference') reference: string,
    @Req() req: Request,
  ) {
    const method = req.method;
    const requestData = method === 'GET' ? req.query : req.body;
    const headers = req.headers as Record<string, string>;
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    return await this.cloudFunctionService.execute(
      reference,
      method,
      requestData,
      headers,
      ip,
      userAgent,
    );
  }

  @All(':reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行云函数（无路径）' })
  @ApiParam({ name: 'reference', description: '云函数引用名称' })
  async executeSimple(
    @Param('reference') reference: string,
    @Req() req: Request,
  ) {
    const method = req.method;
    const requestData = method === 'GET' ? req.query : req.body;
    const headers = req.headers as Record<string, string>;
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    return await this.cloudFunctionService.execute(
      reference,
      method,
      requestData,
      headers,
      ip,
      userAgent,
    );
  }
}