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
import { InviteCodeService } from './invite-code.service';
import { User, AuthProvider } from '../user/entities/user.entity';
import { LoginDto, RegisterDto, AdminRegisterDto, GenerateInviteCodeDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private systemService: SystemService,
    private inviteCodeService: InviteCodeService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, nickname } = registerDto;

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

    // 创建用户（会自动处理第一个用户的管理员权限分配）
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      username,
      nickname,
      provider: AuthProvider.LOCAL,
    });

    // 生成令牌
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
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
    requireInviteCode: boolean;
  }> {
    const isInitialized = await this.systemService.isBlogInitialized();
    const allowRegistration = await this.systemService.getSetting('allow_registration') ?? true;
    const requireInviteCode = await this.systemService.getSetting('require_invite_code') ?? false;

    return {
      isInitialized,
      requiresSetup: !isInitialized,
      allowRegistration,
      requireInviteCode: isInitialized && requireInviteCode,
    };
  }

  /**
   * 管理员注册（首次初始化或通过邀请码）
   */
  async adminRegister(adminRegisterDto: AdminRegisterDto) {
    const { email, password, username, nickname, inviteCode, githubUsername, googleEmail } = adminRegisterDto;
    const isInitialized = await this.systemService.isBlogInitialized();

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

    // 如果博客已初始化，必须提供有效的邀请码
    if (isInitialized) {
      if (!inviteCode) {
        throw new BadRequestException('博客已初始化，注册需要邀请码');
      }
      await this.inviteCodeService.validateInviteCode(inviteCode);
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

    // 如果使用了邀请码，标记为已使用
    if (isInitialized && inviteCode) {
      await this.inviteCodeService.useInviteCode(inviteCode, user.id);
    }

    // 如果是首次初始化，标记博客为已初始化
    if (!isInitialized) {
      await this.systemService.markBlogAsInitialized();
      // 设置默认配置
      await this.systemService.setSetting('require_invite_code', true);
    }

    // 生成令牌
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      isFirstAdmin: !isInitialized,
    };
  }

  /**
   * 生成邀请码（仅管理员）
   */
  async generateInviteCode(
    userId: number,
    generateDto: GenerateInviteCodeDto,
  ) {
    // 验证用户是否为管理员
    const user = await this.userService.findById(userId);
    const isAdmin = user.roles.some(role => role.code === 'admin');
    
    if (!isAdmin) {
      throw new UnauthorizedException('只有管理员可以生成邀请码');
    }

    return this.inviteCodeService.generateInviteCode(userId, generateDto);
  }

  /**
   * 获取邀请码列表
   */
  async getInviteCodes(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      includeUsed?: boolean;
    } = {},
  ) {
    // 验证用户是否为管理员
    const user = await this.userService.findById(userId);
    const isAdmin = user.roles.some(role => role.code === 'admin');
    
    if (!isAdmin) {
      throw new UnauthorizedException('只有管理员可以查看邀请码');
    }

    return this.inviteCodeService.getInviteCodesByUser(userId, options);
  }

  /**
   * 删除邀请码
   */
  async deleteInviteCode(inviteCodeId: number, userId: number) {
    // 验证用户是否为管理员
    const user = await this.userService.findById(userId);
    const isAdmin = user.roles.some(role => role.code === 'admin');
    
    if (!isAdmin) {
      throw new UnauthorizedException('只有管理员可以删除邀请码');
    }

    await this.inviteCodeService.deleteInviteCode(inviteCodeId, userId);
    return { message: '邀请码删除成功' };
  }

  /**
   * 验证邀请码（公开接口）
   */
  async validateInviteCode(code: string) {
    const inviteCode = await this.inviteCodeService.validateInviteCode(code);
    return {
      valid: true,
      expiresAt: inviteCode.expiresAt,
      createdBy: {
        id: inviteCode.createdBy.id,
        username: inviteCode.createdBy.username,
        nickname: inviteCode.createdBy.nickname,
      },
      note: inviteCode.note,
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