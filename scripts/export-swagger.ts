import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function exportSwagger() {
  console.log('正在生成 Swagger 文档...');
  
  // 创建应用实例（不启动服务器）
  const app = await NestFactory.create(AppModule, {
    logger: false, // 禁用日志以保持输出清洁
  });
  
  const configService = app.get(ConfigService);
  
  // 获取配置
  const appName = configService.get<string>('app.name', 'Blog API');
  const appVersion = configService.get<string>('app.version', '1.0.0');
  const appDescription = configService.get<string>('app.description', 'A modern blog API built with NestJS');
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  
  // 设置全局前缀
  app.setGlobalPrefix(apiPrefix);
  
  // Swagger 文档配置
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
    .addTag('认证管理', '用户认证相关接口')
    .addTag('用户管理', '用户管理相关接口')
    .addTag('博客管理', '博客管理相关接口')
    .addTag('分类管理', '分类管理相关接口')
    .addTag('评论管理', '评论管理相关接口')
    .build();
  
  // 生成文档
  const document = SwaggerModule.createDocument(app, config);
  
  // 导出路径
  const outputDir = join(process.cwd(), 'docs');
  const jsonPath = join(outputDir, 'swagger.json');
  const yamlPath = join(outputDir, 'swagger.yaml');
  
  try {
    // 确保目录存在
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 导出 JSON 格式
    writeFileSync(jsonPath, JSON.stringify(document, null, 2));
    console.log(`✅ Swagger JSON 文档已导出到: ${jsonPath}`);
    
    // 导出 YAML 格式
    const yaml = require('js-yaml');
    const yamlContent = yaml.dump(document, { indent: 2 });
    writeFileSync(yamlPath, yamlContent);
    console.log(`✅ Swagger YAML 文档已导出到: ${yamlPath}`);
    
    // 生成使用说明
    const readmePath = join(outputDir, 'README.md');
    const readmeContent = `# API 文档

本目录包含了博客系统的 API 接口文档，可供前端开发者使用。

## 文件说明

- \`swagger.json\`: OpenAPI 3.0 规范的 JSON 格式文档
- \`swagger.yaml\`: OpenAPI 3.0 规范的 YAML 格式文档

## 使用方式

### 1. 在线查看

启动开发服务器后，访问: http://localhost:3000/api/docs

### 2. 导入到 API 工具

可以将 \`swagger.json\` 或 \`swagger.yaml\` 文件导入到以下工具中：

- **Postman**: File → Import → 选择文件
- **Insomnia**: Application → Preferences → Data → Import Data
- **Swagger Editor**: https://editor.swagger.io/ → File → Import File
- **Apifox**: 导入 → OpenAPI → 选择文件

### 3. 代码生成

使用 OpenAPI Generator 可以生成各种语言的客户端代码：

\`\`\`bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript 客户端
openapi-generator-cli generate -i docs/swagger.json -g typescript-axios -o client

# 生成 JavaScript 客户端
openapi-generator-cli generate -i docs/swagger.json -g javascript -o client-js
\`\`\`

### 4. 前端集成示例

#### TypeScript/JavaScript

\`\`\`typescript
// 使用 axios 调用 API
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加认证拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// 获取博客列表
const getBlogs = async (params = {}) => {
  const response = await api.get('/blogs', { params });
  return response.data;
};
\`\`\`

## 认证说明

大部分 API 需要 JWT 认证，请在请求头中添加：

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 更新文档

当 API 发生变化时，运行以下命令重新生成文档：

\`\`\`bash
npm run export:swagger
\`\`\`

## 联系方式

如有问题，请联系后端开发团队。
`;
    
    writeFileSync(readmePath, readmeContent);
    console.log(`✅ 使用说明已生成到: ${readmePath}`);
    
    console.log('\n🎉 文档导出完成！');
    console.log('\n📁 导出的文件:');
    console.log(`   - ${jsonPath}`);
    console.log(`   - ${yamlPath}`);
    console.log(`   - ${readmePath}`);
    console.log('\n💡 提示: 可以将这些文件提供给前端开发者使用');
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// 运行导出
exportSwagger().catch((error) => {
  console.error('❌ 导出过程中发生错误:', error);
  process.exit(1);
});