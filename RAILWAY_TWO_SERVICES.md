# Railway 双服务部署指南

## 架构说明

该项目采用两个独立的服务部署到 Railway：

### Service 1: RFC API Server (node-rfc)
- **功能**: 提供 HTTP API，封装 SAP RFC 调用
- **端口**: 3001
- **Dockerfile**: `Dockerfile.rfc-server`
- **依赖**: SAP NW RFC SDK (需要 C++ 编译)

### Service 2: Web App (Next.js)
- **功能**: 前端界面，通过 HTTP 调用 RFC API Server
- **端口**: 3000 (public)
- **Dockerfile**: `web-app/Dockerfile.railway`
- **依赖**: PostgreSQL 数据库

## Railway 配置步骤

### 1. 创建 Railway 项目
```bash
railway login
railway init
```

### 2. 添加 PostgreSQL 数据库
在 Railway 项目中：
1. 点击 "New" → "Database" → "PostgreSQL"
2. 数据库创建后，记录 `DATABASE_URL`

### 3. 部署 RFC API Server

#### 3.1 创建 Service 1
```bash
# 在项目根目录
railway service create rfc-api-server
```

#### 3.2 配置环境变量
在 Railway Dashboard → rfc-api-server service:
- `PORT`: 3001
- `NODE_ENV`: production

#### 3.3 配置 Dockerfile
在 Railway Dashboard → rfc-api-server → Settings → Build:
- **Root Directory**: `/`
- **Dockerfile Path**: `Dockerfile.rfc-server`

#### 3.4 部署
```bash
railway up --service rfc-api-server
```

#### 3.5 获取内部 URL
部署成功后，在 Railway Dashboard → rfc-api-server → Settings → Networking:
- 记录 **Private Networking** 地址（例如: `rfc-api-server.railway.internal:3001`）

### 4. 部署 Web App

#### 4.1 创建 Service 2
```bash
railway service create web-app
```

#### 4.2 配置环境变量
在 Railway Dashboard → web-app service:
- `DATABASE_URL`: (从 PostgreSQL database service 连接)
- `RFC_API_URL`: `http://rfc-api-server.railway.internal:3001`
- `NEXTAUTH_URL`: `https://<your-domain>.railway.app`
- `NEXTAUTH_SECRET`: (生成一个随机字符串)
- `NODE_ENV`: production

生成 NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

#### 4.3 配置 Dockerfile
在 Railway Dashboard → web-app → Settings → Build:
- **Root Directory**: `/web-app`
- **Dockerfile Path**: `Dockerfile.railway`

或者使用根目录配置：
- **Root Directory**: `/`
- **Dockerfile Path**: `web-app/Dockerfile.railway`

#### 4.4 部署
```bash
railway up --service web-app
```

#### 4.5 添加 Public Domain
在 Railway Dashboard → web-app → Settings → Networking:
- 点击 "Generate Domain" 获得公开访问地址

## 网络通信流程

```
用户浏览器
    ↓ HTTPS
web-app (Service 2, Port 3000)
    ↓ HTTP (Private Network)
rfc-api-server (Service 1, Port 3001)
    ↓ RFC Protocol
SAP 系统
```

## 重要配置项

### RFC API Server 不需要公开访问
- **不要**为 rfc-api-server 添加 public domain
- 使用 Railway 的 **Private Networking** 进行服务间通信
- 更安全，不暴露 SAP 连接到公网

### Web App 需要配置 RFC_API_URL
```env
# Railway 内部网络地址
RFC_API_URL=http://rfc-api-server.railway.internal:3001
```

### 数据库迁移
首次部署后，在 web-app service 中运行：
```bash
railway run npx prisma migrate deploy
```

或在 Railway Dashboard → web-app → Settings → Deploy 中添加:
- **Build Command**: `npm run build`
- **Start Command**: `npm run db:migrate && npm start`

在 web-app/package.json 添加脚本：
```json
{
  "scripts": {
    "db:migrate": "prisma migrate deploy"
  }
}
```

## 本地开发 vs Railway 部署

### 本地开发
- 直接使用 `node-rfc` C++ 模块
- 连接本地 SAP 系统或远程 SAP
- PostgreSQL 在 localhost

### Railway 部署
- web-app 通过 HTTP 调用 rfc-api-server
- rfc-api-server 使用 `node-rfc` 连接 SAP
- PostgreSQL 在 Railway managed database
- 服务间通过 Private Network 通信

## Troubleshooting

### RFC API Server 构建失败
- 确保 `nwrfcsdk` 文件夹在项目根目录
- 检查 Dockerfile.rfc-server 中的路径
- 确认 SAP SDK 版本正确（Linux x86_64）

### Web App 无法连接 RFC API Server
- 检查 `RFC_API_URL` 环境变量是否正确
- 确认使用 Railway Private Network 地址
- 查看 rfc-api-server 日志确认服务启动成功

### 数据库连接失败
- 确认 web-app 正确连接到 PostgreSQL database service
- 检查 `DATABASE_URL` 环境变量
- 确认 prisma migrate 已执行

## 成本优化建议

- RFC API Server 可以使用较小的 instance (512MB RAM)
- Web App 可能需要更大的 instance (1GB+ RAM)
- 考虑使用 Railway 的 sleep mode 节省成本
- 如果 RFC 调用不频繁，可以考虑 serverless 方案

## 下一步

1. ✅ 创建 rfc-server 代码 (完成)
2. ✅ 配置 Dockerfile.rfc-server (完成)
3. ✅ 创建 rfc-api-client.ts for web-app (完成)
4. 🔄 测试 RFC API Server 本地启动
5. 🔄 部署到 Railway 测试
6. 🔄 更新 web-app API routes 使用 rfc-api-client
