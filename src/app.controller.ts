import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger('应用控制器');

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    this.logger.log('收到根路径 GET 请求');
    return this.appService.getHello();
  }
}
