import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuthConfigService implements OnModuleInit {
  private readonly logger = new Logger(OAuthConfigService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.validateOAuthConfigs();
  }

  /**
   * 验证所有 OAuth 配置
   */
  private validateOAuthConfigs() {
    this.logger.log('开始验证 OAuth 配置...');

    const configs = [
      {
        name: 'Google OAuth',
        clientId: this.configService.get('app.oauth.google.clientId'),
        clientSecret: this.configService.get('app.oauth.google.clientSecret'),
      },
      {
        name: 'GitHub OAuth',
        clientId: this.configService.get('app.oauth.github.clientId'),
        clientSecret: this.configService.get('app.oauth.github.clientSecret'),
      },
    ];

    let hasValidConfig = false;

    configs.forEach(config => {
      const isValid = this.validateSingleConfig(config);
      if (isValid) {
        hasValidConfig = true;
      }
    });

    if (!hasValidConfig) {
      this.logger.warn('警告：没有配置任何有效的 OAuth 提供商，用户将无法使用第三方登录');
    } else {
      this.logger.log('OAuth 配置验证完成');
    }
  }

  /**
   * 验证单个 OAuth 配置
   */
  private validateSingleConfig(config: { name: string; clientId: string; clientSecret: string }): boolean {
    const { name, clientId, clientSecret } = config;

    if (!clientId || !clientSecret) {
      this.logger.warn(`${name} 配置不完整：缺少 clientId 或 clientSecret`);
      return false;
    }

    if (clientId.includes('your-') || clientSecret.includes('your-')) {
      this.logger.warn(`${name} 配置使用默认值，请更新为实际的配置`);
      return false;
    }

    this.logger.log(`${name} 配置验证通过`);
    return true;
  }

  /**
   * 获取可用的 OAuth 提供商列表
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];

    const googleClientId = this.configService.get('app.oauth.google.clientId');
    const googleClientSecret = this.configService.get('app.oauth.google.clientSecret');
    if (googleClientId && googleClientSecret && 
        !googleClientId.includes('your-') && !googleClientSecret.includes('your-')) {
      providers.push('google');
    }

    const githubClientId = this.configService.get('app.oauth.github.clientId');
    const githubClientSecret = this.configService.get('app.oauth.github.clientSecret');
    if (githubClientId && githubClientSecret && 
        !githubClientId.includes('your-') && !githubClientSecret.includes('your-')) {
      providers.push('github');
    }

    return providers;
  }

  /**
   * 检查特定提供商是否可用
   */
  isProviderAvailable(provider: 'google' | 'github'): boolean {
    return this.getAvailableProviders().includes(provider);
  }
}