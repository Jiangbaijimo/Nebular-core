import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from './upload.service';
import {
  UploadFileDto,
  FileQueryDto,
  UpdateFileDto,
  BatchDeleteDto,
  FileResponseDto,
} from './dto/upload.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('文件上传')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: '上传文件', description: '上传单个文件到服务器' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '文件上传',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '文件标签',
        },
        generateThumbnail: {
          type: 'boolean',
          description: '是否生成缩略图（仅图片）',
          default: true,
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '上传成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 413, description: '文件过大' })
  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.FILE })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @CurrentUser() user: User,
  ): Promise<FileResponseDto> {
    return this.uploadService.uploadFile(file, uploadDto, user);
  }

  @ApiOperation({ summary: '批量上传文件', description: '一次上传多个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '批量文件上传',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '要上传的文件列表',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '文件标签',
        },
        generateThumbnail: {
          type: 'boolean',
          description: '是否生成缩略图（仅图片）',
          default: true,
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '批量上传成功',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'array',
          items: { $ref: '#/components/schemas/FileResponseDto' },
        },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @Post('batch')
  @UseInterceptors(FileInterceptor('files'))
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.FILE })
  async batchUpload(
    @UploadedFile() files: Express.Multer.File[],
    @Body() uploadDto: UploadFileDto,
    @CurrentUser() user: User,
  ) {
    const results: {
      success: FileResponseDto[];
      failed: { filename: string; error: string }[];
    } = {
      success: [],
      failed: [],
    };

    if (!Array.isArray(files)) {
      files = [files];
    }

    for (const file of files) {
      try {
        const result = await this.uploadService.uploadFile(file, uploadDto, user);
        results.success.push(result);
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return results;
  }

  @ApiOperation({ summary: '获取文件列表', description: '分页获取用户的文件列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.FILE })
  async findAll(
    @Query() query: FileQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.findAll(query, user);
  }

  @ApiOperation({ summary: '获取文件统计', description: '获取用户的文件统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.FILE })
  async getStats(@CurrentUser() user: User) {
    return this.uploadService.getStats(user);
  }

  @ApiOperation({ summary: '安全访问文件', description: '通过临时 token 安全访问文件' })
  @ApiResponse({ status: 200, description: '文件内容' })
  @ApiResponse({ status: 401, description: '无效的访问令牌' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @Public()
  @Get('secure/:token')
  async getSecureFile(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, file } = await this.uploadService.getFileByToken(token);
    
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Cache-Control': 'private, max-age=3600', // 1小时缓存
      'X-Robots-Tag': 'noindex, nofollow', // 防止搜索引擎索引
    });

    return new StreamableFile(stream);
  }

  @ApiOperation({ summary: '生成下载链接', description: '为文件生成临时下载链接' })
  @ApiResponse({ 
    status: 200, 
    description: '下载链接生成成功',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string', description: '下载链接' },
        expiresAt: { type: 'string', format: 'date-time', description: '过期时间' },
        filename: { type: 'string', description: '文件名' }
      }
    }
  })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/download-link')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.FILE })
  async generateDownloadLink(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.generateDownloadLink(id, user);
  }

  @ApiOperation({ summary: '通过令牌下载文件', description: '使用临时令牌下载文件' })
  @ApiResponse({ status: 200, description: '文件内容' })
  @ApiResponse({ status: 401, description: '无效的下载令牌' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @Public()
  @Get('download/:token')
  async downloadByToken(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const result = await this.uploadService.downloadByToken(token);
    
    res.set({
      'Content-Type': result.file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(result.file.originalName)}"`,
      'Content-Length': result.file.size.toString(),
      'Cache-Control': 'private, no-cache',
    });

    res.end(result.buffer);
  }





  @ApiOperation({ summary: '获取缩略图', description: '获取图片的缩略图（公开接口）' })
  @ApiResponse({ status: 200, description: '缩略图内容' })
  @ApiResponse({ status: 404, description: '缩略图不存在' })
  @Public()
  @Get('thumbnails/:filename')
  async getThumbnail(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const buffer = await this.uploadService.getThumbnailBuffer(filename);
    
    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000', // 1年缓存
    });

    res.end(buffer);
  }

  @ApiOperation({ summary: '生成安全访问令牌', description: '为文件生成临时访问令牌' })
  @ApiResponse({ 
    status: 200, 
    description: '令牌生成成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: '访问令牌' },
        secureUrl: { type: 'string', description: '安全访问URL' },
        expiresAt: { type: 'string', format: 'date-time', description: '过期时间' }
      }
    }
  })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/token')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.FILE })
  async generateAccessToken(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.generateAccessToken(id, user);
  }

  @ApiOperation({ summary: '获取文件详情', description: '根据ID获取文件详细信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.FILE })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<FileResponseDto> {
    return this.uploadService.findOne(id, user);
  }

  @ApiOperation({ summary: '更新文件信息', description: '更新文件的描述和标签等信息' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.FILE })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFileDto,
    @CurrentUser() user: User,
  ): Promise<FileResponseDto> {
    return this.uploadService.update(id, updateDto, user);
  }

  @ApiOperation({ summary: '删除文件', description: '删除指定的文件' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.FILE })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.uploadService.remove(id, user);
    return { message: '文件删除成功' };
  }

  @ApiOperation({ summary: '批量删除文件', description: '批量删除多个文件' })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Delete()
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.FILE })
  async batchDelete(
    @Body() batchDeleteDto: BatchDeleteDto,
    @CurrentUser() user: User,
  ) {
    await this.uploadService.batchDelete(batchDeleteDto, user);
    return { message: '批量删除成功' };
  }

  @ApiOperation({ summary: '粘贴上传', description: '支持剪贴板粘贴上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '粘贴上传',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '从剪贴板粘贴的文件',
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: '粘贴上传成功',
    type: FileResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  @Post('paste')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.FILE })
  async pasteUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @CurrentUser() user: User,
  ): Promise<FileResponseDto> {
    // 为粘贴的文件生成一个合适的文件名
    if (!file.originalname || file.originalname === 'blob') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      file.originalname = `paste-${timestamp}.png`;
    }

    return this.uploadService.uploadFile(file, uploadDto, user);
  }
}