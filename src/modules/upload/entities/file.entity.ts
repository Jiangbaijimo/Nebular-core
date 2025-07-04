import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

@Entity('files')
@Index(['userId', 'status'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255, unique: true })
  filename: string;

  @Column({ length: 500 })
  path: string;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 32, nullable: true })
  md5: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  type: FileType;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING,
  })
  status: FileStatus;

  @Column({ type: 'json', nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnailUrl?: string;
    [key: string]: any;
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 虚拟字段：文件大小格式化
  get formattedSize(): string {
    const bytes = Number(this.size);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 虚拟字段：是否为图片
  get isImage(): boolean {
    return this.type === FileType.IMAGE;
  }

  // 虚拟字段：缩略图URL
  get thumbnailUrl(): string | null {
    if (this.metadata?.thumbnailUrl) {
      return this.metadata.thumbnailUrl;
    }
    if (this.isImage) {
      return this.url;
    }
    return null;
  }
}