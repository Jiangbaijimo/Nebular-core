import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
      passReqToCallback: true, // 启用请求对象传递
    });
  }

  async validate(req: any, payload: any) {
    // 从请求头中提取token
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // 检查token是否在黑名单中
    if (token) {
      const isBlacklisted = await this.redisService.get(`blacklist_token:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('令牌已失效，请重新登录');
      }
    }
    
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户账户已被禁用');
    }

    return user;
  }
}