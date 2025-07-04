import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CloudFunction } from './cloud-function.entity';

@Entity('cloud_function_secrets')
export class CloudFunctionSecret {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string; // 密钥名称

  @Column({ type: 'text' })
  value: string; // 密钥值

  @Column({ type: 'text', nullable: true })
  description: string; // 密钥描述

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @ManyToOne(() => CloudFunction, (cloudFunction) => cloudFunction.secrets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cloud_function_id' })
  cloudFunction: CloudFunction;

  @Column()
  cloudFunctionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}