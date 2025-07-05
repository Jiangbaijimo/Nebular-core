import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { RedisService } from '../../common/redis/redis.service';
import { SystemService } from '../system/system.service';
import { User, AuthProvider } from '../user/entities/user.entity';
import { LoginDto, RegisterDto, AdminRegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private systemService: SystemService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.userService.findByEmailWithPassword(email);
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查是否为第一个用户
    const userCount = await this.userService.getUserCount();
    const isFirstUser = userCount === 0;

    // 生成随机用户名和昵称
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const username = `user_${randomSuffix}`;
    const nickname = `用户${randomSuffix}`;
    
    // 生成随机密码
    const randomPassword = Math.random().toString(36).substring(2, 12) + 'A1';
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    let user;
    if (isFirstUser) {
      // 第一个用户创建为管理员
      user = await this.userService.createAdmin({
        email,
        password: hashedPassword,
        username,
        nickname,
        provider: AuthProvider.LOCAL,
      });
      
      // 标记博客为已初始化
      await this.systemService.markBlogAsInitialized();
      // 初始化默认设置
      await this.systemService.initializeDefaultSettings();
    } else {
      // 后续用户创建为普通用户
      user = await this.userService.create({
        email,
        password: hashedPassword,
        username,
        nickname,
        provider: AuthProvider.LOCAL,
      });
    }

    // 生成令牌
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      isFirstUser,
      message: isFirstUser ? '恭喜！您是第一个用户，已自动成为管理员' : '注册成功',
      temporaryPassword: randomPassword, // 返回临时密码供用户使用
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 更新最后登录时间
    await this.userService.updateLastLogin(user.id);

    // 生成令牌
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateOAuthUser(oauthUser: any): Promise<User> {
    let user = await this.userService.findByProviderIdAndProvider(
      oauthUser.providerId,
      oauthUser.provider,
    );

    if (!user) {
      // 检查邮箱是否已存在
      if (oauthUser.email) {
        user = await this.userService.findByEmail(oauthUser.email);
        if (user) {
          // 绑定OAuth账户
          await this.userService.bindOAuthAccount(user.id, {
            provider: oauthUser.provider,
            providerId: oauthUser.providerId,
          });
          return user;
        }
      }

      // 创建新用户
      user = await this.userService.create({
        email: oauthUser.email,
        username: oauthUser.username,
        nickname: oauthUser.nickname,
        avatar: oauthUser.avatar,
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
        emailVerified: true, // OAuth用户默认邮箱已验证
      });
    }

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 检查refresh token是否在Redis中
      const storedToken = await this.redisService.get(`refresh_token:${user.id}`);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('刷新令牌无效');
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async logout(userId: number) {
    // 删除Redis中的refresh token
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: '退出登录成功' };
  }

  async generateTokensForUser(user: User) {
    return this.generateTokens(user);
  }

  /**
   * 检查博客是否已初始化
   */
  async checkBlogInitialization(): Promise<{
    isInitialized: boolean;
    requiresSetup: boolean;
    allowRegistration: boolean;
    adminUserExists: boolean;
    userCount: number;
  }> {
    // 并行获取所有需要的信息
    const [isInitialized, allowRegistration, adminUserExists, userCount] = await Promise.all([
      this.systemService.isBlogInitialized(),
      this.systemService.getSetting('allow_registration'),
      this.userService.hasAdminUser(),
      this.userService.getUserCount(),
    ]);

    // 如果系统设置显示未初始化，但已经有管理员用户，则自动标记为已初始化
    if (!isInitialized && adminUserExists) {
      await this.systemService.markBlogAsInitialized();
      await this.systemService.initializeDefaultSettings();
      return {
        isInitialized: true,
        requiresSetup: false,
        allowRegistration: allowRegistration ?? true,
        adminUserExists: true,
        userCount,
      };
    }

    return {
      isInitialized,
      requiresSetup: !isInitialized,
      allowRegistration: allowRegistration ?? true,
      adminUserExists,
      userCount,
    };
  }

  /**
   * 管理员注册（仅用于首次初始化）
   */
  async adminRegister(adminRegisterDto: AdminRegisterDto) {
    const { email, password, username, nickname, githubUsername, googleEmail } = adminRegisterDto;
    const isInitialized = await this.systemService.isBlogInitialized();

    // 如果博客已初始化，不允许通过此接口注册
    if (isInitialized) {
      throw new BadRequestException('博客已初始化，请使用普通注册接口');
    }

    // 检查邮箱是否已存在
    const existingUser = await this.userService.findByEmailWithPassword(email);
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    if (username) {
      const existingUsername = await this.userService.findByUsernameWithPassword(username);
      if (existingUsername) {
        throw new ConflictException('用户名已被使用');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建管理员用户
    const user = await this.userService.createAdmin({
      email,
      password: hashedPassword,
      username,
      nickname,
      provider: AuthProvider.LOCAL,
      githubUsername,
      googleEmail,
    });

    // 标记博客为已初始化
    await this.systemService.markBlogAsInitialized();
    // 初始化默认设置
    await this.systemService.initializeDefaultSettings();

    // 生成令牌
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      isFirstAdmin: true,
      message: '恭喜！博客初始化完成，您已成为管理员',
    };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    // 将refresh token存储到Redis
    const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn');
    const ttl = this.parseDuration(refreshExpiresIn);
    await this.redisService.set(`refresh_token:${user.id}`, refreshToken, ttl);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)([dhms]?)/);
    if (!match) return 3600; // 默认1小时

    const value = parseInt(match[1]);
    const unit = match[2] || 's';

    switch (unit) {
      case 'd': return value * 24 * 60 * 60;
      case 'h': return value * 60 * 60;
      case 'm': return value * 60;
      case 's': return value;
      default: return value;
    }
  }
}