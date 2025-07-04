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
import { User, AuthProvider } from '../user/entities/user.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username, nickname } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    if (username) {
      const existingUsername = await this.userService.findByUsername(username);
      if (existingUsername) {
        throw new ConflictException('用户名已被使用');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
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
    const user = await this.userService.findByEmail(email);
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
    let user = await this.userService.findByProviderId(
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