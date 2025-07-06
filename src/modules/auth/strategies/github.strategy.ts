import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as https from 'https';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);
  
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // 在开发环境中设置全局https agent忽略SSL证书验证
    if (process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development' || !process.env.NODE_ENV) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('GitHub策略：开发环境已禁用SSL证书验证');
    }
    
    const clientID = configService.get('app.oauth.github.clientId');
    const clientSecret = configService.get('app.oauth.github.clientSecret');
    
    if (!clientID || !clientSecret) {
      const error = 'GitHub OAuth配置缺失：请检查OAUTH_GITHUB_CLIENT_ID和OAUTH_GITHUB_CLIENT_SECRET环境变量';
      console.error(error);
      throw new Error(error);
    }
    
    const callbackURL = 'http://localhost:3000/api/auth/github/callback';
    
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
      passReqToCallback: false,
      customHeaders: {
        'User-Agent': 'BlogApp/1.0',
      },
      timeout: 30000, // 30秒超时
    });
    
    this.logger.log(`GitHub OAuth配置检查: clientID=${clientID ? '已设置' : '未设置'}, clientSecret=${clientSecret ? '已设置' : '未设置'}`);
    this.logger.log(`GitHub OAuth回调URL: ${callbackURL}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    try {
      this.logger.log(`GitHub OAuth验证开始: profile.id=${profile?.id}, username=${profile?.username}`);
      
      if (!profile || !profile.id) {
        throw new Error('GitHub OAuth返回的用户信息无效');
      }
      
      const { id, username, emails, photos } = profile;
      
      const user = {
        providerId: id,
        email: emails?.[0]?.value,
        username,
        nickname: profile.displayName || username,
        avatar: photos?.[0]?.value,
        provider: 'github',
      };
      
      this.logger.log(`GitHub用户信息: ${JSON.stringify(user)}`);
      
      const validatedUser = await this.authService.validateOAuthUser(user);
      this.logger.log(`GitHub OAuth验证成功: userId=${validatedUser.id}`);
      
      done(null, validatedUser);
    } catch (error) {
      this.logger.error(`GitHub OAuth验证失败: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}