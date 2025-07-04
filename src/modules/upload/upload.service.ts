import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import { File, FileType, FileStatus } from './entities/file.entity';
import {
  UploadFileDto,
  FileQueryDto,
  UpdateFileDto,
  BatchDeleteDto,
  UploadUrlDto,
  FileResponseDto,
  UploadUrlResponseDto,
} from './dto/upload.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
    this.allowedMimeTypes = this.configService.get('ALLOWED_MIME_TYPES', [
      // 图片
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // 文档
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      // 压缩文件
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // 音视频
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
    ]);

    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    user: User,
  ): Promise<FileResponseDto> {
    // 验证文件
    this.validateFile(file);

    // 由于使用了 diskStorage，文件已经保存到磁盘，我们需要从磁盘读取
    const filePath = file.path;
    const url = `${this.baseUrl}/api/upload/files/${path.basename(filePath)}`;

    try {
      // 从磁盘读取文件内容计算MD5
      const fileBuffer = await fs.readFile(filePath);
      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');

      // 检查是否已存在相同文件
      const existingFile = await this.fileRepository.findOne({
        where: { md5, userId: user.id },
      });

      if (existingFile && existingFile.status === FileStatus.COMPLETED) {
        this.logger.log(`File already exists: ${existingFile.filename}`);
        // 删除重复文件
        await fs.unlink(filePath);
        return this.toResponseDto(existingFile);
      }

      // 确定文件类型
      const fileType = this.getFileType(file.mimetype);

      // 生成元数据
      const metadata = await this.generateMetadata(
        file,
        filePath,
        uploadDto.generateThumbnail,
      );

      // 创建文件记录
      const filename = path.basename(filePath);
      const relativePath = path.relative(this.uploadDir, filePath);
      
      const fileEntity = this.fileRepository.create({
        originalName: file.originalname,
        filename,
        path: relativePath,
        url,
        mimeType: file.mimetype,
        size: file.size,
        md5,
        type: fileType,
        status: FileStatus.COMPLETED,
        metadata,
        description: uploadDto.description,
        tags: uploadDto.tags || [],
        userId: user.id,
      });

      const savedFile = await this.fileRepository.save(fileEntity);
      this.logger.log(`File uploaded successfully: ${filename}`);

      return this.toResponseDto(savedFile);
    } catch (error) {
      // 清理已上传的文件
      try {
        await fs.unlink(filePath);
      } catch {}

      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('文件上传失败');
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未选择文件');
    }

    if (!file.path) {
      throw new BadRequestException('文件上传失败');
    }

    if (file.size === 0) {
      throw new BadRequestException('文件内容为空');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `文件大小超过限制 (${this.formatFileSize(this.maxFileSize)})`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}${ext}`;
  }

  private getRelativePath(filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(year.toString(), month, day, filename);
  }

  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('sheet') ||
      mimeType.includes('presentation')
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  private async generateMetadata(
    file: Express.Multer.File,
    filePath: string,
    generateThumbnail: boolean = true,
  ): Promise<any> {
    const metadata: any = {};

    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      try {
        const image = sharp(file.buffer);
        const imageMetadata = await image.metadata();
        
        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;
        metadata.format = imageMetadata.format;

        // 生成缩略图
        if (generateThumbnail) {
          const thumbnailPath = await this.generateThumbnail(filePath, file.buffer);
          if (thumbnailPath) {
            metadata.thumbnailUrl = `${this.baseUrl}/api/upload/thumbnails/${path.basename(thumbnailPath)}`;
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to generate image metadata: ${error.message}`);
      }
    }

    return metadata;
  }

  private async generateThumbnail(
    originalPath: string,
    buffer: Buffer,
  ): Promise<string | null> {
    try {
      const thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const filename = path.basename(originalPath, path.extname(originalPath));
      const thumbnailPath = path.join(thumbnailDir, `${filename}_thumb.webp`);

      await sharp(buffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      this.logger.warn(`Failed to generate thumbnail: ${error.message}`);
      return null;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private toResponseDto(file: File): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      formattedSize: file.formattedSize,
      type: file.type,
      status: file.status,
      metadata: file.metadata,
      thumbnailUrl: file.thumbnailUrl,
      description: file.description,
      tags: file.tags,
      downloadCount: file.downloadCount,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  async findAll(query: FileQueryDto, user: User) {
    const { page = 1, limit = 10, type, status, search, tag, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.userId = :userId', { userId: user.id });

    if (type) {
      queryBuilder.andWhere('file.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('file.status = :status', { status });
    } else {
      queryBuilder.andWhere('file.status != :deletedStatus', {
        deletedStatus: FileStatus.DELETED,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(file.originalName LIKE :search OR file.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tag) {
      queryBuilder.andWhere('JSON_CONTAINS(file.tags, :tag)', {
        tag: JSON.stringify(tag),
      });
    }

    queryBuilder
      .orderBy(`file.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [files, total] = await queryBuilder.getManyAndCount();

    return {
      data: files.map(file => this.toResponseDto(file)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, user: User): Promise<FileResponseDto> {
    const file = await this.fileRepository.findOne({
      where: { id, userId: user.id, status: FileStatus.COMPLETED },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 更新访问时间
    await this.fileRepository.update(id, {
      lastAccessedAt: new Date(),
    });

    return this.toResponseDto(file);
  }

  async update(
    id: number,
    updateDto: UpdateFileDto,
    user: User,
  ): Promise<FileResponseDto> {
    const file = await this.fileRepository.findOne({
      where: { id, userId: user.id, status: FileStatus.COMPLETED },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    Object.assign(file, updateDto);
    const updatedFile = await this.fileRepository.save(file);

    return this.toResponseDto(updatedFile);
  }

  async remove(id: number, user: User): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 软删除
    await this.fileRepository.update(id, {
      status: FileStatus.DELETED,
    });

    this.logger.log(`File marked as deleted: ${file.filename}`);
  }

  async batchDelete(batchDeleteDto: BatchDeleteDto, user: User): Promise<void> {
    const { fileIds } = batchDeleteDto;

    const files = await this.fileRepository.find({
      where: {
        id: In(fileIds),
        userId: user.id,
      },
    });

    if (files.length !== fileIds.length) {
      throw new BadRequestException('部分文件不存在或无权限删除');
    }

    await this.fileRepository.update(
      { id: In(fileIds) },
      { status: FileStatus.DELETED },
    );

    this.logger.log(`Batch deleted ${fileIds.length} files`);
  }

  async getFileStream(filename: string) {
    const file = await this.fileRepository.findOne({
      where: { filename, status: FileStatus.COMPLETED },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    const filePath = path.join(this.uploadDir, file.path);

    try {
      await fs.access(filePath);
      
      // 增加下载计数
      await this.fileRepository.increment({ id: file.id }, 'downloadCount', 1);
      
      return {
        stream: await fs.readFile(filePath),
        file,
      };
    } catch {
      throw new NotFoundException('文件不存在');
    }
  }

  async getThumbnailStream(filename: string) {
    const thumbnailPath = path.join(this.uploadDir, 'thumbnails', filename);

    try {
      await fs.access(thumbnailPath);
      return await fs.readFile(thumbnailPath);
    } catch {
      throw new NotFoundException('缩略图不存在');
    }
  }

  async getStats(user: User) {
    const stats = await this.fileRepository
      .createQueryBuilder('file')
      .select([
        'COUNT(*) as totalFiles',
        'SUM(file.size) as totalSize',
        'file.type',
      ])
      .where('file.userId = :userId', { userId: user.id })
      .andWhere('file.status = :status', { status: FileStatus.COMPLETED })
      .groupBy('file.type')
      .getRawMany();

    const totalStats = await this.fileRepository
      .createQueryBuilder('file')
      .select([
        'COUNT(*) as totalFiles',
        'SUM(file.size) as totalSize',
        'SUM(file.downloadCount) as totalDownloads',
      ])
      .where('file.userId = :userId', { userId: user.id })
      .andWhere('file.status = :status', { status: FileStatus.COMPLETED })
      .getRawOne();

    return {
      total: {
        files: parseInt(totalStats.totalFiles) || 0,
        size: parseInt(totalStats.totalSize) || 0,
        downloads: parseInt(totalStats.totalDownloads) || 0,
        formattedSize: this.formatFileSize(parseInt(totalStats.totalSize) || 0),
      },
      byType: stats.map(stat => ({
        type: stat.file_type,
        files: parseInt(stat.totalFiles),
        size: parseInt(stat.totalSize) || 0,
        formattedSize: this.formatFileSize(parseInt(stat.totalSize) || 0),
      })),
    };
  }
}