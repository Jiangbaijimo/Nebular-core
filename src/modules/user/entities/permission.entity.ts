import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // 所有权限
}

export enum PermissionResource {
  USER = 'user',
  BLOG = 'blog',
  COMMENT = 'comment',
  CATEGORY = 'category',
  ROLE = 'role',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  CLOUD_FUNCTION = 'cloud_function',
  FILE = 'file',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column({
    type: 'enum',
    enum: PermissionResource,
  })
  resource: PermissionResource;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean; // 系统权限不可删除

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}