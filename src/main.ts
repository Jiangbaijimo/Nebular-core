import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  logger.log('正在启动 Nest 应用程序...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  const configService = app.get(ConfigService);
  
  // 获取配置
  const port = configService.get<number>('app.port', 3000);
  const host = configService.get<string>('app.host', '0.0.0.0');
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const corsOrigins = configService.get<string[]>('app.corsOrigins', ['http://localhost:3001']);
  const appName = configService.get<string>('app.name', 'Blog API');
  const appVersion = configService.get<string>('app.version', '1.0.0');
  const appDescription = configService.get<string>('app.description', 'A modern blog API built with NestJS');
  
  // 设置全局前缀
  app.setGlobalPrefix(apiPrefix);
  
  // 启用 CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  
  // Swagger 文档配置
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(appDescription)
      .setVersion(appVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', '认证相关接口')
      .addTag('users', '用户管理接口')
      .addTag('blogs', '博客管理接口')
      .addTag('categories', '分类管理接口')
      .addTag('comments', '评论管理接口')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    
    logger.log(`Swagger 文档已启用: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/${apiPrefix}/docs`);
  }
  
  // 启动应用
  await app.listen(port, host);
  
  logger.log(`应用程序已成功启动！`);
  logger.log(`本地访问地址: http://localhost:${port}/${apiPrefix}`);
  logger.log(`局域网访问地址: http://${host}:${port}/${apiPrefix}`);
  logger.log(`环境: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('应用程序启动失败:', error);
  process.exit(1);
});
