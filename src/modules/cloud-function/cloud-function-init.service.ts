import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudFunction, CloudFunctionType, CloudFunctionMethod } from './entities/cloud-function.entity';
import { CloudFunctionSecret } from './entities/cloud-function-secret.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CloudFunctionInitService {
  private readonly logger = new Logger(CloudFunctionInitService.name);

  constructor(
    @InjectRepository(CloudFunction)
    private cloudFunctionRepository: Repository<CloudFunction>,
    @InjectRepository(CloudFunctionSecret)
    private secretRepository: Repository<CloudFunctionSecret>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 初始化示例云函数
   */
  async initializeSampleCloudFunctions(): Promise<void> {
    this.logger.log('开始初始化示例云函数...');

    try {
      // 查找具有管理员角色的用户（第一个注册的用户会自动获得管理员权限）
      const adminUser = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .where('roles.code = :code', { code: 'admin' })
        .getOne();

      if (!adminUser) {
        this.logger.warn('未找到管理员用户，跳过云函数初始化');
        return;
      }

      // 创建主题配置云函数
      await this.createThemeConfigFunction(adminUser);
      
      // 创建站点信息云函数
      await this.createSiteInfoFunction(adminUser);
      
      // 创建动态状态云函数
      await this.createActivityFunction(adminUser);
      
      // 创建个人状态云函数
      await this.createStatusFunction(adminUser);

      this.logger.log('示例云函数初始化完成');
    } catch (error) {
      this.logger.error('初始化示例云函数失败:', error);
    }
  }

  /**
   * 创建主题配置云函数
   */
  private async createThemeConfigFunction(author: User): Promise<void> {
    const existing = await this.cloudFunctionRepository.findOne({
      where: { reference: 'shiro' },
    });

    if (existing) {
      return;
    }

    const themeConfig = {
      footer: {
        otherInfo: {
          date: '2024-{{now}}',
          icp: {
            text: '备案号示例',
            link: 'https://beian.miit.gov.cn'
          }
        },
        linkSections: [
          {
            name: '😊关于',
            links: [
              {
                name: '关于我',
                href: '/about'
              },
              {
                name: '关于此项目',
                href: 'https://github.com/your-repo',
                external: true
              }
            ]
          },
          {
            name: '🧐更多',
            links: [
              {
                name: '时间线',
                href: '/timeline'
              },
              {
                name: '友链',
                href: '/friends'
              }
            ]
          },
          {
            name: '🤗联系',
            links: [
              {
                name: '写留言',
                href: '/message'
              },
              {
                name: '发邮件',
                href: 'mailto:admin@example.com',
                external: true
              }
            ]
          }
        ]
      },
      config: {
        color: {
          light: [
            '#33A6B8',
            '#FF6666',
            '#26A69A',
            '#fb7287',
            '#69a6cc'
          ],
          dark: [
            '#F596AA',
            '#A0A7D4',
            '#ff7b7b',
            '#99D8CF',
            '#838BC6'
          ]
        },
        site: {
          favicon: '/favicon.ico',
          faviconDark: '/favicon-dark.ico'
        },
        hero: {
          title: {
            template: [
              {
                type: 'h1',
                text: 'Hi, I\'m ',
                class: 'font-light text-4xl'
              },
              {
                type: 'h1',
                text: 'Admin',
                class: 'font-medium mx-2 text-4xl'
              },
              {
                type: 'h1',
                text: '👋。',
                class: 'font-light text-4xl'
              }
            ]
          },
          description: '欢迎来到我的博客系统！'
        },
        module: {
          activity: {
            enable: true,
            endpoint: '/fn/ps/update'
          },
          donate: {
            enable: false
          }
        }
      }
    };

    const cloudFunction = this.cloudFunctionRepository.create({
      name: 'shiro-theme-config',
      reference: 'shiro',
      description: 'Shiro主题配置',
      type: CloudFunctionType.JSON,
      method: CloudFunctionMethod.GET,
      content: JSON.stringify(themeConfig, null, 2),
      isPublic: true,
      author,
      authorId: author.id,
    });

    await this.cloudFunctionRepository.save(cloudFunction);
    this.logger.log('创建主题配置云函数: shiro');
  }

  /**
   * 创建站点信息云函数
   */
  private async createSiteInfoFunction(author: User): Promise<void> {
    const existing = await this.cloudFunctionRepository.findOne({
      where: { reference: 'site-info' },
    });

    if (existing) {
      return;
    }

    const siteInfo = {
      name: '我的博客',
      description: '一个基于NestJS的现代化博客系统',
      author: 'Admin',
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      features: [
        '用户管理',
        '博客发布',
        '评论系统',
        '分类管理',
        '云函数支持'
      ],
      contact: {
        email: 'admin@example.com',
        github: 'https://github.com/your-repo'
      }
    };

    const cloudFunction = this.cloudFunctionRepository.create({
      name: 'site-info',
      reference: 'site-info',
      description: '站点基本信息',
      type: CloudFunctionType.JSON,
      method: CloudFunctionMethod.GET,
      content: JSON.stringify(siteInfo, null, 2),
      isPublic: true,
      author,
      authorId: author.id,
    });

    await this.cloudFunctionRepository.save(cloudFunction);
    this.logger.log('创建站点信息云函数: site-info');
  }

  /**
   * 创建动态状态云函数
   */
  private async createActivityFunction(author: User): Promise<void> {
    const existing = await this.cloudFunctionRepository.findOne({
      where: { reference: 'ps' },
    });

    if (existing) {
      return;
    }

    const functionCode = `
export default async function handler(ctx) {
  const {
    timestamp,
    process: processName,
    key,
    media,
    meta,
  } = ctx.req.body || {};
  
  // 处理GET请求
  if (ctx.req.method === 'GET') {
    const [processInfo, mediaInfo] = await Promise.all([
      ctx.storage.cache.get('ps'),
      ctx.storage.cache.get('media'),
    ]);
    
    return {
      processName: processInfo?.name,
      processInfo,
      mediaInfo,
    };
  }
  
  // 处理POST请求
  if (!key) {
    ctx.throws(400, '缺少密钥参数');
    return;
  }
  
  const validKey = ctx.secret.update_key || 'demo-key';
  if (key !== validKey) {
    ctx.throws(401, '密钥验证失败');
    return;
  }
  
  const processInfo = {
    name: processName,
    ...meta,
  };
  
  // 缓存进程信息
  await ctx.storage.cache.set('ps', processInfo, 300);
  
  if (media) {
    await ctx.storage.cache.set('media', media, 10);
  }
  
  // 广播更新事件
  ctx.broadcast('ps-update', {
    processInfo,
    process: processInfo.name,
    timestamp: Date.now(),
  });
  
  return {
    ok: 1,
    processInfo,
    timestamp: Date.now(),
  };
}
`;

    const cloudFunction = this.cloudFunctionRepository.create({
      name: 'activity-update',
      reference: 'ps',
      description: '动态状态更新',
      type: CloudFunctionType.FUNCTION,
      method: CloudFunctionMethod.ALL,
      content: functionCode,
      isPublic: true,
      author,
      authorId: author.id,
    });

    const saved = await this.cloudFunctionRepository.save(cloudFunction);

    // 创建密钥
    const secret = this.secretRepository.create({
      key: 'update_key',
      value: 'demo-update-key-123',
      description: '动态更新密钥',
      cloudFunctionId: saved.id,
    });

    await this.secretRepository.save(secret);
    this.logger.log('创建动态状态云函数: ps');
  }

  /**
   * 创建个人状态云函数
   */
  private async createStatusFunction(author: User): Promise<void> {
    const existing = await this.cloudFunctionRepository.findOne({
      where: { reference: 'status' },
    });

    if (existing) {
      return;
    }

    const functionCode = `
function assetAuth(ctx) {
  const body = ctx.req.body;
  const authKey = ctx.secret.status_key;
  if (ctx.isAuthenticated) return;
  if (body.key !== authKey) {
    ctx.throws(401, 'Unauthorized');
  }
}

export default async function handler(ctx) {
  const method = ctx.req.method.toLowerCase();
  
  switch (method) {
    case 'get': {
      return GET(ctx);
    }
    case 'post': {
      assetAuth(ctx);
      return POST(ctx);
    }
    case 'delete': {
      assetAuth(ctx);
      return DELETE(ctx);
    }
    default: {
      ctx.throws(405, 'Method Not Allowed');
    }
  }
}

const cacheKey = 'user:status';

function DELETE(ctx) {
  ctx.storage.cache.del(cacheKey);
  ctx.broadcast('status-update', null);
  return { message: '状态已清除' };
}

function POST(ctx) {
  const body = ctx.req.body;
  const { emoji, icon, desc } = body;
  const ttl = body.ttl || 86400; // 1 day
  
  const status = {
    emoji,
    icon,
    desc,
    ttl,
    untilAt: Date.now() + ttl * 1000,
  };
  
  ctx.storage.cache.set(cacheKey, JSON.stringify(status), ttl);
  ctx.broadcast('status-update', status);
  
  return { message: '状态更新成功', status };
}

function GET(ctx) {
  const status = ctx.storage.cache.get(cacheKey);
  return status ? JSON.parse(status) : null;
}
`;

    const cloudFunction = this.cloudFunctionRepository.create({
      name: 'user-status',
      reference: 'status',
      description: '用户状态管理',
      type: CloudFunctionType.FUNCTION,
      method: CloudFunctionMethod.ALL,
      content: functionCode,
      isPublic: true,
      author,
      authorId: author.id,
    });

    const saved = await this.cloudFunctionRepository.save(cloudFunction);

    // 创建密钥
    const secret = this.secretRepository.create({
      key: 'status_key',
      value: 'demo-status-key-456',
      description: '状态管理密钥',
      cloudFunctionId: saved.id,
    });

    await this.secretRepository.save(secret);
    this.logger.log('创建个人状态云函数: status');
  }
}