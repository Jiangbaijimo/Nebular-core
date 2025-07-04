import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CloudFunction } from './cloud-function.entity';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

@Entity('cloud_function_logs')
export class CloudFunctionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string; // 日志消息

  @Column({ type: 'json', nullable: true })
  requestData: any; // 请求数据

  @Column({ type: 'json', nullable: true })
  responseData: any; // 响应数据

  @Column({ nullable: true })
  executionTime: number; // 执行时间（毫秒）

  @Column({ nullable: true })
  userAgent: string; // 用户代理

  @Column({ nullable: true })
  ip: string; // 请求IP

  @Column({ type: 'json', nullable: true })
  headers: Record<string, string>; // 请求头

  @Column({ nullable: true })
  statusCode: number; // HTTP状态码

  @Column({ type: 'text', nullable: true })
  errorStack: string; // 错误堆栈

  @ManyToOne(() => CloudFunction, (cloudFunction) => cloudFunction.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cloud_function_id' })
  cloudFunction: CloudFunction;

  @Column()
  cloudFunctionId: number;

  @CreateDateColumn()
  createdAt: Date;
}