# 认证模块 (Auth Module)

## 概述

本模块提供了完整的用户认证功能，包括：
- 用户注册/登录
- JWT 令牌管理
- OAuth 第三方登录（Google、GitHub）
- 管理员初始化

## OAuth 配置

### 环境变量配置

在 `.env` 文件中配置以下变量：

```env
# Google OAuth
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
OAUTH_GITHUB_CLIENT_ID=your-github-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret
```

### OAuth 应用配置

#### Google OAuth 应用
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 设置授权回调 URI：`http://localhost:3000/api/auth/google/callback`

#### GitHub OAuth 应用
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置 Authorization callback URL：`http://localhost:3000/api/auth/github/callback`

## 故障排除

### 常见问题

#### 1. SSL 证书验证错误
**错误信息：** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

**解决方案：** 本项目已在开发环境中自动处理此问题，通过设置 `rejectUnauthorized: false`。

#### 2. OAuth 配置检查
访问健康检查端点：`GET /api/auth/oauth/health`

```json
{
  "availableProviders": ["github"],
  "providerStatus": {
    "google": false,
    "github": true
  },
  "timestamp": "2025-01-06T10:43:07.000Z"
}
```

#### 3. 回调 URL 不匹配
确保 OAuth 应用中配置的回调 URL 与代码中的 `callbackURL` 一致：
- Google: `http://localhost:3000/api/auth/google/callback`
- GitHub: `http://localhost:3000/api/auth/github/callback`

### 调试日志

启动应用时会自动验证 OAuth 配置：

```
[Nest] LOG [OAuthConfigService] 开始验证 OAuth 配置...
[Nest] LOG [OAuthConfigService] GitHub OAuth 配置验证通过
[Nest] LOG [OAuthConfigService] Google OAuth 配置使用默认值，请更新为实际的配置
[Nest] LOG [OAuthConfigService] OAuth 配置验证完成
```

## API 端点

### OAuth 登录
- `GET /api/auth/google` - Google OAuth 登录
- `GET /api/auth/github` - GitHub OAuth 登录

### OAuth 回调
- `GET /api/auth/google/callback` - Google OAuth 回调
- `GET /api/auth/github/callback` - GitHub OAuth 回调

### 健康检查
- `GET /api/auth/oauth/health` - OAuth 配置状态检查

## 安全注意事项

1. **生产环境配置**：确保在生产环境中使用有效的 SSL 证书
2. **密钥安全**：不要将 OAuth 密钥提交到版本控制系统
3. **回调 URL**：生产环境中使用 HTTPS 回调 URL
4. **环境隔离**：开发、测试、生产环境使用不同的 OAuth 应用

## 开发建议

1. 使用 OAuth 健康检查端点验证配置
2. 查看应用启动日志确认 OAuth 配置状态
3. 在开发过程中监控 OAuth 相关的错误日志
4. 定期更新 OAuth 应用的密钥