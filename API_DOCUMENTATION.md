# NestJS 博客系统 API 接口文档

## 基本信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`
- **API文档**: `http://localhost:3000/api/docs` (Swagger)

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "错误信息",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## 认证模块 (Auth)

### 用户注册
- **接口**: `POST /auth/register`
- **描述**: 用户注册
- **权限**: 公开

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "username": "username",
  "nickname": "昵称"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "nickname": "昵称",
      "status": "active"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": "1h"
  }
}
```

### 用户登录
- **接口**: `POST /auth/login`
- **描述**: 用户登录
- **权限**: 公开

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**响应**: 同注册响应

### 刷新令牌
- **接口**: `POST /auth/refresh`
- **描述**: 刷新访问令牌
- **权限**: 公开

**请求参数**:
```json
{
  "refreshToken": "refresh_token"
}
```

### 退出登录
- **接口**: `POST /auth/logout`
- **描述**: 用户退出登录
- **权限**: 需要认证

### 获取用户信息
- **接口**: `GET /auth/profile`
- **描述**: 获取当前用户信息
- **权限**: 需要认证

### OAuth 认证
- **Google登录**: `GET /auth/google`
- **Google回调**: `GET /auth/google/callback`
- **GitHub登录**: `GET /auth/github`
- **GitHub回调**: `GET /auth/github/callback`

## 用户模块 (Users)

### 创建用户
- **接口**: `POST /users`
- **描述**: 创建新用户
- **权限**: 需要 `CREATE_USER` 权限

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "username": "username",
  "nickname": "昵称",
  "bio": "个人简介",
  "avatar": "头像URL"
}
```

### 获取用户列表
- **接口**: `GET /users`
- **描述**: 获取用户列表
- **权限**: 需要 `READ_USER` 权限

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 用户状态 (active/inactive/banned)
- `search`: 搜索关键词

### 获取用户详情
- **接口**: `GET /users/:id`
- **描述**: 获取指定用户详情
- **权限**: 需要 `READ_USER` 权限

### 更新用户信息
- **接口**: `PATCH /users/:id`
- **描述**: 更新用户信息
- **权限**: 需要 `UPDATE_USER` 权限

### 获取个人资料
- **接口**: `GET /users/profile`
- **描述**: 获取当前用户资料
- **权限**: 需要认证

### 更新个人资料
- **接口**: `PATCH /users/profile`
- **描述**: 更新当前用户资料
- **权限**: 需要认证

### 修改用户状态
- **接口**: `PATCH /users/:id/status`
- **描述**: 修改用户状态
- **权限**: 需要 `UPDATE_USER` 权限

**请求参数**:
```json
{
  "status": "active" // active/inactive/banned
}
```

### 分配角色
- **接口**: `POST /users/:id/roles`
- **描述**: 为用户分配角色
- **权限**: 需要 `UPDATE_USER` 权限

**请求参数**:
```json
{
  "roleId": 1
}
```

### 移除角色
- **接口**: `DELETE /users/:id/roles/:roleId`
- **描述**: 移除用户角色
- **权限**: 需要 `UPDATE_USER` 权限

### 删除用户
- **接口**: `DELETE /users/:id`
- **描述**: 删除用户
- **权限**: 需要 `DELETE_USER` 权限

### 用户统计
- **接口**: `GET /users/stats`
- **描述**: 获取用户统计信息
- **权限**: 需要 `READ_USER` 权限

## 博客模块 (Blogs)

### 创建博客
- **接口**: `POST /blogs`
- **描述**: 创建新博客
- **权限**: 需要 `CREATE_BLOG` 权限

**请求参数**:
```json
{
  "title": "博客标题",
  "slug": "blog-slug",
  "summary": "博客摘要",
  "content": "博客内容",
  "coverImage": "封面图片URL",
  "status": "draft", // draft/published/archived
  "isTop": false,
  "allowComment": true,
  "tags": ["标签1", "标签2"],
  "seoKeywords": ["关键词1", "关键词2"],
  "seoDescription": "SEO描述",
  "categoryIds": [1, 2]
}
```

### 获取博客列表
- **接口**: `GET /blogs`
- **描述**: 获取博客列表（公开）
- **权限**: 公开

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `status`: 博客状态
- `search`: 搜索关键词
- `categoryId`: 分类ID
- `authorId`: 作者ID
- `tag`: 标签
- `sortBy`: 排序字段
- `sortOrder`: 排序方向 (ASC/DESC)

### 管理员博客列表
- **接口**: `GET /blogs/admin`
- **描述**: 获取所有博客列表（管理员）
- **权限**: 需要 `READ_BLOG` 权限

### 获取博客详情
- **接口**: `GET /blogs/:id`
- **描述**: 获取博客详情
- **权限**: 公开

### 通过Slug获取博客
- **接口**: `GET /blogs/slug/:slug`
- **描述**: 通过slug获取博客
- **权限**: 公开

### 更新博客
- **接口**: `PATCH /blogs/:id`
- **描述**: 更新博客
- **权限**: 需要 `UPDATE_BLOG` 权限或博客作者

### 删除博客
- **接口**: `DELETE /blogs/:id`
- **描述**: 删除博客
- **权限**: 需要 `DELETE_BLOG` 权限或博客作者

### 博客点赞
- **接口**: `POST /blogs/:id/like`
- **描述**: 点赞博客
- **权限**: 公开

### 取消点赞
- **接口**: `DELETE /blogs/:id/like`
- **描述**: 取消点赞
- **权限**: 公开

### 博客统计
- **接口**: `GET /blogs/stats`
- **描述**: 获取博客统计信息
- **权限**: 需要 `READ_BLOG` 权限

## 分类模块 (Categories)

### 创建分类
- **接口**: `POST /categories`
- **描述**: 创建新分类
- **权限**: 需要 `CREATE_CATEGORY` 权限

**请求参数**:
```json
{
  "name": "分类名称",
  "slug": "category-slug",
  "description": "分类描述",
  "coverImage": "封面图片URL",
  "isActive": true,
  "sort": 1,
  "parentId": null // 父分类ID，null表示顶级分类
}
```

### 获取分类列表
- **接口**: `GET /categories`
- **描述**: 获取分类列表（公开）
- **权限**: 公开

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词
- `isActive`: 是否激活
- `parentId`: 父分类ID
- `includeChildren`: 是否包含子分类
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

### 管理员分类列表
- **接口**: `GET /categories/admin`
- **描述**: 获取所有分类列表（管理员）
- **权限**: 需要 `READ_CATEGORY` 权限

### 获取分类树
- **接口**: `GET /categories/tree`
- **描述**: 获取分类树结构
- **权限**: 公开

### 获取分类详情
- **接口**: `GET /categories/:id`
- **描述**: 获取分类详情
- **权限**: 公开

### 通过Slug获取分类
- **接口**: `GET /categories/slug/:slug`
- **描述**: 通过slug获取分类
- **权限**: 公开

### 更新分类
- **接口**: `PATCH /categories/:id`
- **描述**: 更新分类
- **权限**: 需要 `UPDATE_CATEGORY` 权限

### 更新博客数量
- **接口**: `PATCH /categories/:id/blog-count`
- **描述**: 更新分类下的博客数量
- **权限**: 需要 `UPDATE_CATEGORY` 权限

### 删除分类
- **接口**: `DELETE /categories/:id`
- **描述**: 删除分类
- **权限**: 需要 `DELETE_CATEGORY` 权限

### 分类统计
- **接口**: `GET /categories/stats`
- **描述**: 获取分类统计信息
- **权限**: 需要 `READ_CATEGORY` 权限

## 评论模块 (Comments)

### 创建评论
- **接口**: `POST /comments`
- **描述**: 创建新评论
- **权限**: 需要 `CREATE_COMMENT` 权限

**请求参数**:
```json
{
  "content": "评论内容",
  "blogId": 1,
  "parentId": null // 父评论ID，null表示顶级评论
}
```

### 获取评论列表
- **接口**: `GET /comments`
- **描述**: 获取评论列表（管理员）
- **权限**: 需要 `READ_COMMENT` 权限

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `status`: 评论状态
- `search`: 搜索关键词
- `blogId`: 博客ID
- `authorId`: 作者ID
- `parentId`: 父评论ID
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

### 获取博客评论
- **接口**: `GET /comments/blog/:blogId`
- **描述**: 获取指定博客的评论
- **权限**: 公开

**查询参数**:
- `includeChildren`: 是否包含子评论 (true/false)

### 获取我的评论
- **接口**: `GET /comments/my`
- **描述**: 获取当前用户的评论
- **权限**: 需要 `READ_COMMENT` 权限

### 获取评论详情
- **接口**: `GET /comments/:id`
- **描述**: 获取评论详情
- **权限**: 需要 `READ_COMMENT` 权限

### 更新评论
- **接口**: `PATCH /comments/:id`
- **描述**: 更新评论
- **权限**: 需要 `UPDATE_COMMENT` 权限或评论作者

### 修改评论状态
- **接口**: `PATCH /comments/:id/status`
- **描述**: 修改评论状态
- **权限**: 需要 `UPDATE_COMMENT` 权限

**请求参数**:
```json
{
  "status": "approved" // pending/approved/rejected
}
```

### 审核通过评论
- **接口**: `POST /comments/:id/approve`
- **描述**: 审核通过评论
- **权限**: 需要 `UPDATE_COMMENT` 权限

### 拒绝评论
- **接口**: `POST /comments/:id/reject`
- **描述**: 拒绝评论
- **权限**: 需要 `UPDATE_COMMENT` 权限

### 点赞评论
- **接口**: `POST /comments/:id/like`
- **描述**: 点赞评论
- **权限**: 公开

### 取消点赞评论
- **接口**: `DELETE /comments/:id/like`
- **描述**: 取消点赞评论
- **权限**: 公开

### 删除评论
- **接口**: `DELETE /comments/:id`
- **描述**: 删除评论
- **权限**: 需要 `DELETE_COMMENT` 权限或评论作者

### 评论统计
- **接口**: `GET /comments/stats`
- **描述**: 获取评论统计信息
- **权限**: 需要 `READ_COMMENT` 权限

## 状态码说明

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突
- `422`: 验证失败
- `429`: 请求过于频繁
- `500`: 服务器内部错误

## 权限系统

### 权限资源 (PermissionResource)
- `USER`: 用户管理
- `BLOG`: 博客管理
- `CATEGORY`: 分类管理
- `COMMENT`: 评论管理

### 权限操作 (PermissionAction)
- `CREATE`: 创建
- `READ`: 读取
- `UPDATE`: 更新
- `DELETE`: 删除
- `MANAGE`: 管理（包含所有操作）

## 数据模型

### 用户状态 (UserStatus)
- `active`: 激活
- `inactive`: 未激活
- `banned`: 已封禁

### 博客状态 (BlogStatus)
- `draft`: 草稿
- `published`: 已发布
- `archived`: 已归档

### 评论状态 (CommentStatus)
- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已拒绝

### 认证提供商 (AuthProvider)
- `local`: 本地认证
- `google`: Google OAuth
- `github`: GitHub OAuth

## 限流规则

- 默认限制: 每分钟10次请求
- 可通过环境变量配置:
  - `THROTTLE_TTL`: 时间窗口（秒）
  - `THROTTLE_LIMIT`: 请求次数限制

## 环境变量

```env
# 应用配置
APP_NAME=博客后端系统
APP_PORT=3000
APP_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=blog_system

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# OAuth配置
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

# 前端URL
FRONTEND_URL=http://localhost:3001

# 限流配置
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## 使用示例

### 认证流程
```javascript
// 1. 用户登录
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123'
  })
});

const { data } = await loginResponse.json();
const { accessToken } = data;

// 2. 使用token访问受保护的接口
const profileResponse = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 创建博客
```javascript
const createBlogResponse = await fetch('/api/blogs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    title: '我的第一篇博客',
    content: '这是博客内容...',
    status: 'published',
    categoryIds: [1]
  })
});
```

### 获取博客列表
```javascript
const blogsResponse = await fetch('/api/blogs?page=1&limit=10&status=published');
const { data } = await blogsResponse.json();
console.log(data.data); // 博客列表
console.log(data.total); // 总数
```

---

**注意**: 本文档基于当前代码结构生成，实际使用时请参考最新的Swagger文档 (`/api/docs`) 获取最准确的接口信息。