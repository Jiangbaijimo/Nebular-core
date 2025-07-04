import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLoggerService } from './custom-logger.service';

async function bootstrap() {
  const customLogger = new CustomLoggerService('启动器');
  
  customLogger.log('正在启动 Nest 应用程序...');
  
  const app = await NestFactory.create(AppModule, {
    logger: customLogger,
  });
  
  // 使用自定义日志服务
  app.useLogger(customLogger);
  
  // 启用 CORS 以支持跨域访问
  app.enableCors();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  
  customLogger.log(`应用程序已成功启动！`);
  customLogger.log(`本地访问地址: http://localhost:${port}`);
  customLogger.log(`局域网访问地址: http://0.0.0.0:${port}`);
  customLogger.log(`支持局域网访问已启用`);
}
bootstrap();
