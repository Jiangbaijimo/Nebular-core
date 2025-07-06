import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as https from 'https';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // 在开发环境中设置全局https agent忽略SSL证书验证
    if (process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development' || !process.env.NODE_ENV) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('Google策略：开发环境已禁用SSL证书验证');
    }
    
    const clientID = configService.get('app.oauth.google.clientId');
    const clientSecret = configService.get('app.oauth.google.clientSecret');
    
    if (!clientID || !clientSecret) {
      const error = 'Google OAuth配置缺失：请检查OAUTH_GOOGLE_CLIENT_ID和OAUTH_GOOGLE_CLIENT_SECRET环境变量';
      console.error(error);
      throw new Error(error);
    }
    
    const callbackURL = 'http://localhost:3000/api/auth/google/callback';
    
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      passReqToCallback: false,
      customHeaders: {
        'User-Agent': 'BlogApp/1.0',
      },
      timeout: 30000, // 30秒超时
    });
    
    this.logger.log(`Google OAuth配置检查: clientID=${clientID ? '已设置' : '未设置'}, clientSecret=${clientSecret ? '已设置' : '未设置'}`);
    this.logger.log(`Google OAuth回调URL: ${callbackURL}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.log(`Google OAuth验证开始: profile.id=${profile?.id}, displayName=${profile?.displayName}`);
      
      if (!profile || !profile.id) {
        throw new Error('Google OAuth返回的用户信息无效');
      }
      
      const { id, name, emails, photos } = profile;
      
      if (!emails || !emails[0] || !emails[0].value) {
        throw new Error('Google OAuth未返回有效的邮箱信息');
      }
      
      const user = {
        providerId: id,
        email: emails[0].value,
        nickname: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : profile.displayName,
        avatar: photos && photos[0] ? photos[0].value : null,
        provider: 'google',
      };
      
      this.logger.log(`Google用户信息: ${JSON.stringify(user)}`);
      
      const validatedUser = await this.authService.validateOAuthUser(user);
      this.logger.log(`Google OAuth验证成功: userId=${validatedUser.id}`);
      
      done(null, validatedUser);
    } catch (error) {
      this.logger.error(`Google OAuth验证失败: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}