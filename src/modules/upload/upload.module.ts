import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { File } from './entities/file.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    UserModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uploadPath = configService.get('UPLOAD_PATH', './uploads');
        
        // 确保上传目录存在
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        
        // 确保缩略图目录存在
        const thumbnailPath = join(uploadPath, 'thumbnails');
        if (!existsSync(thumbnailPath)) {
          mkdirSync(thumbnailPath, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              // 根据文件类型创建不同的子目录
              let subDir = 'others';
              if (file.mimetype.startsWith('image/')) {
                subDir = 'images';
              } else if (file.mimetype.startsWith('video/')) {
                subDir = 'videos';
              } else if (file.mimetype.startsWith('audio/')) {
                subDir = 'audios';
              } else if (
                file.mimetype.includes('pdf') ||
                file.mimetype.includes('document') ||
                file.mimetype.includes('text') ||
                file.mimetype.includes('spreadsheet') ||
                file.mimetype.includes('presentation')
              ) {
                subDir = 'documents';
              }

              const destPath = join(uploadPath, subDir);
              if (!existsSync(destPath)) {
                mkdirSync(destPath, { recursive: true });
              }
              
              cb(null, destPath);
            },
            filename: (req, file, cb) => {
              // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
              const timestamp = Date.now();
              const randomNum = Math.round(Math.random() * 1E9);
              const ext = extname(file.originalname);
              const filename = `${timestamp}-${randomNum}${ext}`;
              cb(null, filename);
            },
          }),
          limits: {
            fileSize: configService.get('MAX_FILE_SIZE', 50 * 1024 * 1024), // 默认50MB
            files: 10, // 最多10个文件
          },
          fileFilter: (req, file, cb) => {
            // 允许的MIME类型
            const allowedMimes = [
              // 图片
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/svg+xml',
              'image/bmp',
              'image/tiff',
              // 视频
              'video/mp4',
              'video/avi',
              'video/mov',
              'video/wmv',
              'video/flv',
              'video/webm',
              'video/mkv',
              // 音频
              'audio/mp3',
              'audio/wav',
              'audio/flac',
              'audio/aac',
              'audio/ogg',
              'audio/wma',
              // 文档
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
              'text/csv',
              'text/markdown',
              'text/html',
              'text/css',
              'text/javascript',
              'application/json',
              'application/xml',
              // 压缩文件
              'application/zip',
              'application/x-rar-compressed',
              'application/x-7z-compressed',
              'application/x-tar',
              'application/gzip',
              // 其他常用格式
              'application/octet-stream',
            ];

            if (allowedMimes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
            }
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}