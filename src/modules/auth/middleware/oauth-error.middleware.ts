import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OAuthErrorMiddleware implements NestMiddleware {
  private readonly logger = new Logger(OAuthErrorMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // 检查是否是 OAuth 回调路径
    if (req.path.includes('/auth/') && req.path.includes('/callback')) {
      this.logger.log(`OAuth 回调请求: ${req.method} ${req.path}`);
      this.logger.log(`查询参数: ${JSON.stringify(req.query)}`);
      
      // 检查是否有 OAuth 错误参数
      if (req.query.error) {
        this.logger.error(`OAuth 错误: ${req.query.error}`);
        if (req.query.error_description) {
          this.logger.error(`错误描述: ${req.query.error_description}`);
        }
        if (req.query.error_uri) {
          this.logger.error(`错误详情链接: ${req.query.error_uri}`);
        }
      }
    }

    next();
  }
}