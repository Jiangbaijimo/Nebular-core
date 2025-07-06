import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthConfigService } from './services/oauth-config.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AdminRegisterDto, ExchangeCodeDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';


@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthConfigService: OAuthConfigService,
  ) {}

  @ApiOperation({ summary: '用户注册', description: '创建新用户账户' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '用户登录', description: '用户登录获取访问令牌' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: '刷新令牌', description: '使用刷新令牌获取新的访问令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '刷新令牌无效' })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @ApiOperation({ summary: '用户登出', description: '用户登出并使令牌失效' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    // 从请求头中提取access token
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;
    
    return this.authService.logout(user.id, accessToken);
  }

  @ApiOperation({ summary: '获取用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.roles,
    };
  }

  @ApiOperation({ summary: '验证token有效性', description: '检查当前token是否有效（未被注销）' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 401, description: 'token无效或已失效' })
  @ApiBearerAuth('JWT-auth')
  @Get('verify-token')
  async verifyToken(@CurrentUser() user: User, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;
    
    if (!accessToken) {
      throw new UnauthorizedException('未提供访问令牌');
    }
    
    const isValid = await this.authService.isTokenValid(accessToken);
    
    if (!isValid) {
      throw new UnauthorizedException('令牌已失效');
    }
    
    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  // Google OAuth
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // 重定向到 Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      if (!req.user) {
        throw new Error('Google OAuth认证失败：未获取到用户信息');
      }
      
      const user = await this.authService.validateOAuthUser(req.user as any);
      // 生成临时授权码
      const authCode = await this.authService.generateAuthCode(user);
      
      // 重定向到前端，携带授权码
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?code=${authCode}`);
    } catch (error) {
      console.error('Google OAuth回调错误:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  // GitHub OAuth
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // 重定向到 GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('GitHub OAuth回调开始，req.user:', req.user);
      console.log('GitHub OAuth回调开始，req.query:', req.query);
      
      // 检查是否有OAuth错误
      if (req.query.error) {
        const errorDescription = req.query.error_description || req.query.error;
        throw new Error(`GitHub OAuth错误: ${errorDescription}`);
      }
      
      if (!req.user) {
        throw new Error('GitHub OAuth认证失败：未获取到用户信息');
      }
      
      const user = await this.authService.validateOAuthUser(req.user as any);
      // 生成临时授权码
      const authCode = await this.authService.generateAuthCode(user);
      
      // 重定向到前端，携带授权码
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?code=${authCode}`);
    } catch (error) {
      console.error('GitHub OAuth回调错误:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  @ApiOperation({ 
    summary: '授权码交换令牌', 
    description: '使用OAuth授权码交换访问令牌和刷新令牌' 
  })
  @ApiResponse({ status: 200, description: '交换成功' })
  @ApiResponse({ status: 401, description: '授权码无效或已过期' })
  @Public()
  @Post('exchange-code')
  @HttpCode(HttpStatus.OK)
  async exchangeCode(@Body() exchangeCodeDto: ExchangeCodeDto) {
    return this.authService.exchangeCodeForTokens(exchangeCodeDto.code);
  }

  @ApiOperation({ 
    summary: '检查博客初始化状态', 
    description: '检查博客是否已完成初始化，包含管理员用户状态和用户数量信息，支持自动修复不一致状态' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '检查成功',
    schema: {
      type: 'object',
      properties: {
        isInitialized: { type: 'boolean', description: '是否已初始化' },
        requiresSetup: { type: 'boolean', description: '是否需要设置' },
        allowRegistration: { type: 'boolean', description: '是否允许注册' },
        adminUserExists: { type: 'boolean', description: '是否存在管理员用户' },
        userCount: { type: 'number', description: '用户总数' }
      }
    }
  })
  @Public()
  @Get('check-initialization')
  async checkInitialization() {
    return this.authService.checkBlogInitialization();
  }

  @ApiOperation({ 
    summary: '管理员注册', 
    description: '管理员注册接口，仅用于博客首次初始化时创建第一个管理员用户' 
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或博客已初始化' })
  @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
  @Public()
  @Post('admin-register')
  async adminRegister(@Body() adminRegisterDto: AdminRegisterDto) {
    return this.authService.adminRegister(adminRegisterDto);
  }

  @ApiOperation({ 
    summary: 'OAuth 配置健康检查', 
    description: '检查 OAuth 提供商的配置状态，用于开发调试' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '检查成功',
    schema: {
      type: 'object',
      properties: {
        availableProviders: { 
          type: 'array', 
          items: { type: 'string' },
          description: '可用的 OAuth 提供商列表' 
        },
        providerStatus: {
          type: 'object',
          description: '各提供商的配置状态'
        }
      }
    }
  })
  @Public()
  @Get('oauth/health')
  async checkOAuthHealth() {
    const availableProviders = this.oauthConfigService.getAvailableProviders();
    
    return {
      availableProviders,
      providerStatus: {
        google: this.oauthConfigService.isProviderAvailable('google'),
        github: this.oauthConfigService.isProviderAvailable('github'),
      },
      timestamp: new Date().toISOString(),
    };
  }

}