import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../modules/user/entities/role.entity';
import { Permission, PermissionAction, PermissionResource } from '../../modules/user/entities/permission.entity';
import { Category } from '../../modules/category/entities/category.entity';
import { Blog, BlogStatus } from '../../modules/blog/entities/blog.entity';
import { User } from '../../modules/user/entities/user.entity';
import { CloudFunctionInitService } from '../../modules/cloud-function/cloud-function-init.service';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cloudFunctionInitService: CloudFunctionInitService,
  ) {}

  async onModuleInit() {
    await this.initializeRolesAndPermissions();
  }

  private async initializeRolesAndPermissions() {
    this.logger.log('开始初始化系统基础数据...');

    try {
      // 创建基础权限
      await this.createPermissions();
      
      // 创建基础角色
      await this.createRoles();
      
      // 创建基础分类
      await this.createBaseCategories();
      
      // 创建基础博客
      await this.createBaseBlogs();
      
      // 初始化示例云函数
      await this.cloudFunctionInitService.initializeSampleCloudFunctions();
      
      this.logger.log('系统基础数据初始化完成');
    } catch (error) {
      this.logger.error('初始化系统基础数据失败:', error);
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

  private async createBaseCategories() {
    this.logger.log('开始创建基础分类...');

    const categories = [
      // 首页分类
      {
        name: '首页',
        slug: 'home',
        description: '首页相关内容',
        icon: '🏠',
        color: '#3b82f6',
        sort: 1,
        children: [
          { name: '自述', slug: 'about-me', description: '个人介绍', sort: 1 },
          { name: '此站点', slug: 'about-site', description: '站点介绍', sort: 2 },
          { name: '留言', slug: 'guestbook', description: '留言板', sort: 3 },
          { name: '历史', slug: 'history', description: '历史记录', sort: 4 },
          { name: '迭代', slug: 'changelog', description: '更新日志', sort: 5 },
          { name: '关于友链', slug: 'about-friends', description: '友情链接说明', sort: 6 },
        ],
      },
      // 文稿分类
      {
        name: '文稿',
        slug: 'posts',
        description: '文章内容',
        icon: '📝',
        color: '#10b981',
        sort: 2,
        children: [
          { name: '生活', slug: 'life', description: '生活随笔', sort: 1 },
          { name: '归档', slug: 'archive', description: '文章归档', sort: 2 },
        ],
      },
      // 手记分类
      {
        name: '手记',
        slug: 'notes',
        description: '学习笔记',
        icon: '📚',
        color: '#f59e0b',
        sort: 3,
      },
      // 时光分类
      {
        name: '时光',
        slug: 'timeline',
        description: '时光记录',
        icon: '⏰',
        color: '#8b5cf6',
        sort: 4,
        children: [
          { name: '手记', slug: 'timeline-notes', description: '时光手记', sort: 1 },
          { name: '文稿', slug: 'timeline-posts', description: '时光文稿', sort: 2 },
          { name: '回忆', slug: 'memories', description: '回忆录', sort: 3 },
          { name: '专栏', slug: 'columns', description: '专栏文章', sort: 4 },
        ],
      },
      // 思考分类
      {
        name: '思考',
        slug: 'thinking',
        description: '思考感悟',
        icon: '💭',
        color: '#ef4444',
        sort: 5,
      },
      // 更多分类
      {
        name: '更多',
        slug: 'more',
        description: '更多内容',
        icon: '📦',
        color: '#6b7280',
        sort: 6,
        children: [
          { name: '友链', slug: 'friends', description: '友情链接', sort: 1 },
          { name: '项目', slug: 'projects', description: '项目展示', sort: 2 },
          { name: '一言', slug: 'hitokoto', description: '一言语录', sort: 3 },
          { name: '跃迁', slug: 'transition', description: '跃迁记录', sort: 4 },
        ],
      },
    ];

    for (const categoryData of categories) {
      const { children, ...parentData } = categoryData;
      
      // 检查父分类是否已存在
      let parentCategory = await this.categoryRepository.findOne({
        where: { slug: parentData.slug },
      });

      if (!parentCategory) {
        parentCategory = this.categoryRepository.create(parentData);
        await this.categoryRepository.save(parentCategory);
        this.logger.log(`创建分类: ${parentData.name}`);
      }

      // 创建子分类
      if (children && children.length > 0) {
        for (const childData of children) {
          const existingChild = await this.categoryRepository.findOne({
            where: { slug: childData.slug },
          });

          if (!existingChild) {
            const childCategory = this.categoryRepository.create({
              ...childData,
              parent: parentCategory,
              parentId: parentCategory.id,
            });
            await this.categoryRepository.save(childCategory);
            this.logger.log(`创建子分类: ${childData.name}`);
          }
        }
      }
    }
  }

  private async createBaseBlogs() {
    this.logger.log('开始创建基础博客...');

    // 查找具有管理员角色的用户（第一个注册的用户会自动获得管理员权限）
    const adminUser = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.code = :code', { code: 'admin' })
      .getOne();

    if (!adminUser) {
      this.logger.warn('未找到管理员用户，跳过博客初始化');
      return;
    }

    // 获取分类
    const aboutMeCategory = await this.categoryRepository.findOne({
      where: { slug: 'about-me' },
    });
    const aboutSiteCategory = await this.categoryRepository.findOne({
      where: { slug: 'about-site' },
    });
    const guestbookCategory = await this.categoryRepository.findOne({
      where: { slug: 'guestbook' },
    });
    const lifeCategory = await this.categoryRepository.findOne({
      where: { slug: 'life' },
    });

    const blogs = [
      {
        title: '关于我',
        slug: 'about-me',
        summary: '个人介绍页面',
        content: `# 关于我

欢迎来到我的博客！

## 个人简介

这里是个人介绍的内容，你可以在这里分享你的故事、经历和想法。

## 联系方式

- 邮箱：your-email@example.com
- GitHub：https://github.com/yourusername

## 技能

- 前端开发
- 后端开发
- 全栈开发

感谢你的访问！`,
        status: BlogStatus.PUBLISHED,
        isTop: true,
        allowComment: true,
        tags: ['关于', '个人介绍'],
        seoKeywords: ['关于我', '个人介绍', '博客'],
        seoDescription: '个人介绍页面，了解博主的基本信息',
        categories: aboutMeCategory ? [aboutMeCategory] : [],
      },
      {
        title: '关于此站点',
        slug: 'about-site',
        summary: '站点介绍和技术栈',
        content: `# 关于此站点

## 技术栈

本站点采用现代化的技术栈构建：

### 后端
- **框架**: NestJS
- **数据库**: MySQL
- **缓存**: Redis
- **认证**: JWT
- **文档**: Swagger

### 前端
- **框架**: React/Vue (可选)
- **样式**: Tailwind CSS
- **构建工具**: Vite

## 功能特性

- 📝 博客文章管理
- 🏷️ 分类标签系统
- 💬 评论系统
- 📁 文件上传
- ☁️ 云函数支持
- 🔐 权限管理
- 📊 数据统计

## 开源

本项目基于开源协议，欢迎贡献代码！`,
        status: BlogStatus.PUBLISHED,
        isTop: false,
        allowComment: true,
        tags: ['技术', '站点介绍', 'NestJS'],
        seoKeywords: ['站点介绍', '技术栈', 'NestJS', '博客系统'],
        seoDescription: '介绍本站点的技术栈和功能特性',
        categories: aboutSiteCategory ? [aboutSiteCategory] : [],
      },
      {
        title: '留言板',
        slug: 'guestbook',
        summary: '欢迎在这里留言',
        content: `# 留言板

欢迎来到留言板！

## 留言须知

1. 请文明留言，禁止发布违法违规内容
2. 支持 Markdown 语法
3. 留言会经过审核后显示
4. 欢迎交流技术、分享想法

## 友情提示

- 可以在评论区留下你的想法
- 如果有技术问题，欢迎讨论
- 也可以分享有趣的网站或资源

期待你的留言！ 😊`,
        status: BlogStatus.PUBLISHED,
        isTop: false,
        allowComment: true,
        tags: ['留言板', '交流'],
        seoKeywords: ['留言板', '交流', '评论'],
        seoDescription: '博客留言板，欢迎留言交流',
        categories: guestbookCategory ? [guestbookCategory] : [],
      },
      {
        title: '欢迎来到我的博客',
        slug: 'welcome',
        summary: '博客的第一篇文章',
        content: `# 欢迎来到我的博客

这是博客的第一篇文章，标志着这个个人空间的正式启动！

## 博客的初衷

创建这个博客的目的是：

- 📝 记录学习和工作中的心得体会
- 🤝 与同行交流技术和想法
- 📚 整理和分享有价值的知识
- 🌱 见证自己的成长历程

## 内容规划

博客将主要包含以下内容：

### 技术文章
- 前端开发经验
- 后端架构设计
- 数据库优化
- 系统运维

### 生活随笔
- 读书笔记
- 旅行见闻
- 生活感悟
- 兴趣爱好

### 项目分享
- 开源项目
- 实战案例
- 解决方案

## 期待

希望这个博客能够：
- 帮助到有需要的朋友
- 促进技术交流和学习
- 记录美好的时光

感谢你的访问，期待与你的交流！`,
        status: BlogStatus.PUBLISHED,
        isTop: false,
        allowComment: true,
        tags: ['欢迎', '博客', '开始'],
        seoKeywords: ['博客', '欢迎', '技术分享'],
        seoDescription: '博客的第一篇文章，欢迎来到我的个人博客',
        categories: lifeCategory ? [lifeCategory] : [],
      },
    ];

    for (const blogData of blogs) {
      const existingBlog = await this.blogRepository.findOne({
        where: { slug: blogData.slug },
      });

      if (!existingBlog) {
        const { categories, ...blogInfo } = blogData;
        const blog = this.blogRepository.create({
          ...blogInfo,
          author: adminUser,
          authorId: adminUser.id,
          publishedAt: new Date(),
        });

        const savedBlog = await this.blogRepository.save(blog);

        // 关联分类
        if (categories && categories.length > 0) {
          savedBlog.categories = categories;
          await this.blogRepository.save(savedBlog);
        }

        this.logger.log(`创建博客: ${blogData.title}`);
      }
    }
  }
}