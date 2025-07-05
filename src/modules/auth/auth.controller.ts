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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AdminRegisterDto, GenerateInviteCodeDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { Query, Param, Delete } from '@nestjs/common';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
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
    const user = await this.authService.validateOAuthUser(req.user as any);
    const tokens = await this.authService.generateTokensForUser(user);
    // 重定向到前端，携带 token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
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
    const user = await this.authService.validateOAuthUser(req.user as any);
    const tokens = await this.authService.generateTokensForUser(user);
    // 重定向到前端，携带 token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }

  @ApiOperation({ 
    summary: '检查博客初始化状态', 
    description: '检查博客是否已完成初始化，用于前端判断注册流程' 
  })
  @ApiResponse({ status: 200, description: '检查成功' })
  @Public()
  @Get('check-initialization')
  async checkInitialization() {
    return this.authService.checkBlogInitialization();
  }

  @ApiOperation({ 
    summary: '管理员注册', 
    description: '管理员注册接口，首次注册无需邀请码，后续注册需要有效邀请码' 
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或邀请码无效' })
  @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
  @Public()
  @Post('admin-register')
  async adminRegister(@Body() adminRegisterDto: AdminRegisterDto) {
    return this.authService.adminRegister(adminRegisterDto);
  }

  @ApiOperation({ 
    summary: '生成邀请码', 
    description: '管理员生成邀请码，用于邀请其他管理员注册' 
  })
  @ApiResponse({ status: 201, description: '生成成功' })
  @ApiResponse({ status: 401, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Post('invite-codes')
  async generateInviteCode(
    @CurrentUser() user: User,
    @Body() generateDto: GenerateInviteCodeDto,
  ) {
    return this.authService.generateInviteCode(user.id, generateDto);
  }

  @ApiOperation({ 
    summary: '获取邀请码列表', 
    description: '管理员查看自己创建的邀请码列表' 
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '权限不足' })
  @ApiBearerAuth('JWT-auth')
  @Get('invite-codes')
  async getInviteCodes(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeUsed') includeUsed?: boolean,
  ) {
    return this.authService.getInviteCodes(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      includeUsed: includeUsed !== undefined ? Boolean(includeUsed) : undefined,
    });
  }

  @ApiOperation({ 
    summary: '验证邀请码', 
    description: '验证邀请码是否有效，用于前端注册表单验证' 
  })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '邀请码无效或已过期' })
  @ApiResponse({ status: 404, description: '邀请码不存在' })
  @Public()
  @Get('invite-codes/:code/validate')
  async validateInviteCode(@Param('code') code: string) {
    return this.authService.validateInviteCode(code);
  }

  @ApiOperation({ 
    summary: '删除邀请码', 
    description: '管理员删除自己创建的邀请码' 
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '权限不足' })
  @ApiResponse({ status: 404, description: '邀请码不存在' })
  @ApiBearerAuth('JWT-auth')
  @Delete('invite-codes/:id')
  async deleteInviteCode(
    @CurrentUser() user: User,
    @Param('id') id: number,
  ) {
    return this.authService.deleteInviteCode(Number(id), user.id);
  }
}