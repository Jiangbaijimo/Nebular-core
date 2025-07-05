import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InviteCodeService } from './invite-code.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UserModule } from '../user/user.module';
import { SystemModule } from '../system/system.module';
import { RedisService } from '../../common/redis/redis.service';
import { InviteCode } from './entities/invite-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteCode]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    SystemModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    InviteCodeService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    RedisService,
  ],
  exports: [AuthService, InviteCodeService, JwtModule],
})
export class AuthModule {}