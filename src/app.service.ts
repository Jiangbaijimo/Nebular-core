import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger('应用服务');

  getHello(): string {
    this.logger.log('正在处理问候请求');
    return '你好，世界！欢迎使用 NestJS 应用程序！';
  }
}
