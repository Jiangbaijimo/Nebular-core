import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CloudFunctionSecret } from './cloud-function-secret.entity';
import { CloudFunctionLog } from './cloud-function-log.entity';

export enum CloudFunctionType {
  JSON = 'json',
  FUNCTION = 'function',
}

export enum CloudFunctionMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  ALL = 'ALL',
}

export enum CloudFunctionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

@Entity('cloud_functions')
export class CloudFunction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  reference: string; // 引用名称，用于前端调用

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CloudFunctionType,
    default: CloudFunctionType.JSON,
  })
  type: CloudFunctionType;

  @Column({
    type: 'enum',
    enum: CloudFunctionMethod,
    default: CloudFunctionMethod.GET,
  })
  method: CloudFunctionMethod;

  @Column({
    type: 'enum',
    enum: CloudFunctionStatus,
    default: CloudFunctionStatus.ACTIVE,
  })
  status: CloudFunctionStatus;

  @Column({ type: 'longtext' })
  content: string; // JSON数据或函数代码

  @Column({ type: 'json', nullable: true })
  config: Record<string, any>; // 额外配置信息

  @Column({ default: 0 })
  callCount: number; // 调用次数

  @Column({ nullable: true })
  lastCalledAt: Date; // 最后调用时间

  @Column({ nullable: true })
  lastError: string; // 最后错误信息

  @Column({ default: false })
  isPublic: boolean; // 是否公开访问

  @Column({ default: 5000 })
  timeout: number; // 超时时间（毫秒）

  @Column({ type: 'json', nullable: true })
  headers: Record<string, string>; // 自定义响应头

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => CloudFunctionSecret, (secret) => secret.cloudFunction)
  secrets: CloudFunctionSecret[];

  @OneToMany(() => CloudFunctionLog, (log) => log.cloudFunction)
  logs: CloudFunctionLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}