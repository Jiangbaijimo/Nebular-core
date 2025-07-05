import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// 配置
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

// 数据库服务
import { DatabaseService } from './common/database/database.service';
import { DatabaseInitService } from './common/database/database-init.service';
import { RedisService } from './common/redis/redis.service';
import { CloudFunctionInitService } from './modules/cloud-function/cloud-function-init.service';

// 守卫、过滤器、拦截器、管道
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';

// 实体
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/user/entities/role.entity';
import { Permission } from './modules/user/entities/permission.entity';
import { Blog } from './modules/blog/entities/blog.entity';
import { Category } from './modules/category/entities/category.entity';
import { Comment } from './modules/comment/entities/comment.entity';
import { CloudFunction } from './modules/cloud-function/entities/cloud-function.entity';
import { CloudFunctionSecret } from './modules/cloud-function/entities/cloud-function-secret.entity';
import { CloudFunctionLog } from './modules/cloud-function/entities/cloud-function-log.entity';
import { File } from './modules/upload/entities/file.entity';
import { InviteCode } from './modules/auth/entities/invite-code.entity';
import { SystemSetting } from './modules/system/entities/system-setting.entity';

// 模块
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BlogModule } from './modules/blog/blog.module';
import { CategoryModule } from './modules/category/category.module';
import { CommentModule } from './modules/comment/comment.module';
import { CloudFunctionModule } from './modules/cloud-function/cloud-function.module';
import { UploadModule } from './modules/upload/upload.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: '.env',
    }),
    
    // 数据库模块
    TypeOrmModule.forRootAsync({
      useClass: DatabaseService,
    }),
    
    // 注册实体以供数据库初始化服务使用
    TypeOrmModule.forFeature([User, Role, Permission, Blog, Category, Comment, CloudFunction, CloudFunctionSecret, CloudFunctionLog, File, InviteCode, SystemSetting]),
    
    // 限流模块
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
          },
        ],
      }),
    }),
    
    // 业务模块
    AuthModule,
    UserModule,
    BlogModule,
    CategoryModule,
    CommentModule,
    CloudFunctionModule,
    UploadModule,
    SystemModule,
  ],
  providers: [
    // 全局服务
    RedisService,
    DatabaseInitService,
    CloudFunctionInitService,
    
    // 全局守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    
    // 全局过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    
    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    
    // 全局管道
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
