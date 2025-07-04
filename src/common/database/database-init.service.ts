import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../modules/user/entities/role.entity';
import { Permission, PermissionAction, PermissionResource } from '../../modules/user/entities/permission.entity';
import { CloudFunctionInitService } from '../../modules/cloud-function/cloud-function-init.service';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private cloudFunctionInitService: CloudFunctionInitService,
  ) {}

  async onModuleInit() {
    await this.initializeRolesAndPermissions();
  }

  private async initializeRolesAndPermissions() {
    this.logger.log('开始初始化角色和权限数据...');

    try {
      // 创建基础权限
      await this.createPermissions();
      
      // 创建基础角色
      await this.createRoles();
      
      // 初始化示例云函数
      await this.cloudFunctionInitService.initializeSampleCloudFunctions();
      
      this.logger.log('角色和权限数据初始化完成');
    } catch (error) {
      this.logger.error('初始化角色和权限数据失败:', error);
    }
  }

  private async createPermissions() {
    const permissions = [
      // 用户管理权限
      { name: '创建用户', code: 'CREATE_USER', action: PermissionAction.CREATE, resource: PermissionResource.USER },
      { name: '查看用户', code: 'READ_USER', action: PermissionAction.READ, resource: PermissionResource.USER },
      { name: '更新用户', code: 'UPDATE_USER', action: PermissionAction.UPDATE, resource: PermissionResource.USER },
      { name: '删除用户', code: 'DELETE_USER', action: PermissionAction.DELETE, resource: PermissionResource.USER },
      { name: '管理用户', code: 'MANAGE_USER', action: PermissionAction.MANAGE, resource: PermissionResource.USER },
      
      // 博客管理权限
      { name: '创建博客', code: 'CREATE_BLOG', action: PermissionAction.CREATE, resource: PermissionResource.BLOG },
      { name: '查看博客', code: 'READ_BLOG', action: PermissionAction.READ, resource: PermissionResource.BLOG },
      { name: '更新博客', code: 'UPDATE_BLOG', action: PermissionAction.UPDATE, resource: PermissionResource.BLOG },
      { name: '删除博客', code: 'DELETE_BLOG', action: PermissionAction.DELETE, resource: PermissionResource.BLOG },
      { name: '管理博客', code: 'MANAGE_BLOG', action: PermissionAction.MANAGE, resource: PermissionResource.BLOG },
      
      // 分类管理权限
      { name: '创建分类', code: 'CREATE_CATEGORY', action: PermissionAction.CREATE, resource: PermissionResource.CATEGORY },
      { name: '查看分类', code: 'READ_CATEGORY', action: PermissionAction.READ, resource: PermissionResource.CATEGORY },
      { name: '更新分类', code: 'UPDATE_CATEGORY', action: PermissionAction.UPDATE, resource: PermissionResource.CATEGORY },
      { name: '删除分类', code: 'DELETE_CATEGORY', action: PermissionAction.DELETE, resource: PermissionResource.CATEGORY },
      { name: '管理分类', code: 'MANAGE_CATEGORY', action: PermissionAction.MANAGE, resource: PermissionResource.CATEGORY },
      
      // 评论管理权限
      { name: '创建评论', code: 'CREATE_COMMENT', action: PermissionAction.CREATE, resource: PermissionResource.COMMENT },
      { name: '查看评论', code: 'READ_COMMENT', action: PermissionAction.READ, resource: PermissionResource.COMMENT },
      { name: '更新评论', code: 'UPDATE_COMMENT', action: PermissionAction.UPDATE, resource: PermissionResource.COMMENT },
      { name: '删除评论', code: 'DELETE_COMMENT', action: PermissionAction.DELETE, resource: PermissionResource.COMMENT },
      { name: '管理评论', code: 'MANAGE_COMMENT', action: PermissionAction.MANAGE, resource: PermissionResource.COMMENT },
      
      // 角色管理权限
      { name: '创建角色', code: 'CREATE_ROLE', action: PermissionAction.CREATE, resource: PermissionResource.ROLE },
      { name: '查看角色', code: 'READ_ROLE', action: PermissionAction.READ, resource: PermissionResource.ROLE },
      { name: '更新角色', code: 'UPDATE_ROLE', action: PermissionAction.UPDATE, resource: PermissionResource.ROLE },
      { name: '删除角色', code: 'DELETE_ROLE', action: PermissionAction.DELETE, resource: PermissionResource.ROLE },
      { name: '管理角色', code: 'MANAGE_ROLE', action: PermissionAction.MANAGE, resource: PermissionResource.ROLE },
      
      // 权限管理权限
      { name: '创建权限', code: 'CREATE_PERMISSION', action: PermissionAction.CREATE, resource: PermissionResource.PERMISSION },
      { name: '查看权限', code: 'READ_PERMISSION', action: PermissionAction.READ, resource: PermissionResource.PERMISSION },
      { name: '更新权限', code: 'UPDATE_PERMISSION', action: PermissionAction.UPDATE, resource: PermissionResource.PERMISSION },
      { name: '删除权限', code: 'DELETE_PERMISSION', action: PermissionAction.DELETE, resource: PermissionResource.PERMISSION },
      { name: '管理权限', code: 'MANAGE_PERMISSION', action: PermissionAction.MANAGE, resource: PermissionResource.PERMISSION },
      
      // 系统管理权限
      { name: '系统管理', code: 'MANAGE_SYSTEM', action: PermissionAction.MANAGE, resource: PermissionResource.SYSTEM },
      
      // 云函数管理权限
      { name: '创建云函数', code: 'CREATE_CLOUD_FUNCTION', action: PermissionAction.CREATE, resource: PermissionResource.CLOUD_FUNCTION },
      { name: '查看云函数', code: 'READ_CLOUD_FUNCTION', action: PermissionAction.READ, resource: PermissionResource.CLOUD_FUNCTION },
      { name: '更新云函数', code: 'UPDATE_CLOUD_FUNCTION', action: PermissionAction.UPDATE, resource: PermissionResource.CLOUD_FUNCTION },
      { name: '删除云函数', code: 'DELETE_CLOUD_FUNCTION', action: PermissionAction.DELETE, resource: PermissionResource.CLOUD_FUNCTION },
      { name: '管理云函数', code: 'MANAGE_CLOUD_FUNCTION', action: PermissionAction.MANAGE, resource: PermissionResource.CLOUD_FUNCTION },
      
      // 文件管理权限
      { name: '创建文件', code: 'CREATE_FILE', action: PermissionAction.CREATE, resource: PermissionResource.FILE },
      { name: '查看文件', code: 'READ_FILE', action: PermissionAction.READ, resource: PermissionResource.FILE },
      { name: '更新文件', code: 'UPDATE_FILE', action: PermissionAction.UPDATE, resource: PermissionResource.FILE },
      { name: '删除文件', code: 'DELETE_FILE', action: PermissionAction.DELETE, resource: PermissionResource.FILE },
      { name: '管理文件', code: 'MANAGE_FILE', action: PermissionAction.MANAGE, resource: PermissionResource.FILE },
    ];

    for (const permissionData of permissions) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: permissionData.code },
      });

      if (!existingPermission) {
        const permission = this.permissionRepository.create(permissionData);
        await this.permissionRepository.save(permission);
        this.logger.log(`创建权限: ${permissionData.name}`);
      }
    }
  }

  private async createRoles() {
    // 创建超级管理员角色
    await this.createAdminRole();
    
    // 创建编辑者角色
    await this.createEditorRole();
    
    // 创建普通用户角色
    await this.createUserRole();
  }

  private async createAdminRole() {
    const existingRole = await this.roleRepository.findOne({
      where: { code: 'admin' },
      relations: ['permissions'],
    });

    if (!existingRole) {
      // 获取所有权限
      const allPermissions = await this.permissionRepository.find();
      
      const adminRole = this.roleRepository.create({
        name: '超级管理员',
        code: 'admin',
        description: '系统超级管理员，拥有所有权限',
        isSystem: true,
        permissions: allPermissions,
      });
      
      await this.roleRepository.save(adminRole);
      this.logger.log('创建超级管理员角色');
    }
  }

  private async createEditorRole() {
    const existingRole = await this.roleRepository.findOne({
      where: { code: 'editor' },
    });

    if (!existingRole) {
      // 编辑者权限：可以管理博客、分类、评论、云函数、文件，但不能管理用户和系统
      const editorPermissions = await this.permissionRepository.find({
        where: [
          { resource: PermissionResource.BLOG },
          { resource: PermissionResource.CATEGORY },
          { resource: PermissionResource.COMMENT },
          { resource: PermissionResource.CLOUD_FUNCTION },
          { resource: PermissionResource.FILE },
        ],
      });
      
      const editorRole = this.roleRepository.create({
        name: '编辑者',
        code: 'editor',
        description: '内容编辑者，可以管理博客、分类、评论和云函数',
        isSystem: true,
        permissions: editorPermissions,
      });
      
      await this.roleRepository.save(editorRole);
      this.logger.log('创建编辑者角色');
    }
  }

  private async createUserRole() {
    const existingRole = await this.roleRepository.findOne({
      where: { code: 'user' },
    });

    if (!existingRole) {
      // 普通用户权限：只能查看博客、对自己的评论进行增删改查操作、上传和管理自己的文件
      // 注意：普通用户不能创建博客，只有主人公(admin)和管理员(editor)才能创建博客
      const userPermissions = await this.permissionRepository.find({
        where: [
          { code: 'READ_BLOG' },
          { code: 'CREATE_COMMENT' },
          { code: 'READ_COMMENT' },
          { code: 'UPDATE_COMMENT' }, // 允许编辑自己的评论
          { code: 'DELETE_COMMENT' }, // 允许删除自己的评论
          { code: 'READ_CATEGORY' },
          { code: 'CREATE_FILE' }, // 允许上传文件
          { code: 'READ_FILE' }, // 允许查看文件
          { code: 'UPDATE_FILE' }, // 允许更新自己的文件
          { code: 'DELETE_FILE' }, // 允许删除自己的文件
        ],
      });
      
      const userRole = this.roleRepository.create({
        name: '普通用户',
        code: 'user',
        description: '普通用户，可以查看博客、对自己的评论进行增删改查操作',
        isSystem: true,
        permissions: userPermissions,
      });
      
      await this.roleRepository.save(userRole);
      this.logger.log('创建普通用户角色');
    }
  }
}