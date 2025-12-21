# Railway 部署指南

## 项目结构

本项目包含两个独立的服务，需要在 Railway 上分别部署：

1. **Web App** - Next.js 前端应用（Mock 模式）
2. **RFC Server** - Express.js API 服务器（需要 SAP SDK）

---

## 🚀 快速部署

### 方式一：通过 Railway CLI

#### 1. 部署 Web App

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 创建新项目（第一次）
railway init

# 使用 Dockerfile.web-app 部署
railway up --dockerfile Dockerfile.web-app

# 设置环境变量
railway variables set MOCK_MODE=true
railway variables set DATABASE_URL=your-postgres-url
railway variables set NEXTAUTH_SECRET=your-secret-key
railway variables set NEXTAUTH_URL=https://your-app.railway.app
```

#### 2. 部署 RFC Server

```bash
# 在同一个项目中创建新服务
railway service create rfc-server

# 使用 Dockerfile.rfc-server 部署
railway up --dockerfile Dockerfile.rfc-server --service rfc-server

# 设置环境变量（如果需要默认连接）
railway variables set PORT=3001 --service rfc-server
```

---

### 方式二：通过 Railway Dashboard

#### 1. 创建 Web App 服务

1. 进入 Railway Dashboard
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 GitHub 仓库
5. 在 Settings 中配置：
   - **Build**: 
     - Builder: Dockerfile
     - Dockerfile Path: `Dockerfile.web-app`
   - **Deploy**:
     - Start Command: `npx prisma migrate deploy && npm start`
     - Port: `3000`
   - **Environment Variables**:
     ```
     MOCK_MODE=true
     NODE_ENV=production
     DATABASE_URL=postgresql://...  # Railway 自动提供
     NEXTAUTH_SECRET=your-secret-key
     NEXTAUTH_URL=https://your-app.railway.app
     ```

#### 2. 创建 RFC Server 服务

1. 在同一个项目中点击 "New Service"
2. 选择 "GitHub Repo" (同一个仓库)
3. 配置：
   - **Build**:
     - Builder: Dockerfile
     - Dockerfile Path: `Dockerfile.rfc-server`
   - **Deploy**:
     - Start Command: `node index.js`
     - Port: `3001`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3001
     ```

---

## 📦 Dockerfile 说明

### Dockerfile.web-app

**用途**: 部署 Next.js Web 应用（Mock 模式，无需 SAP SDK）

**特点**:
- ✅ 轻量级镜像（node:18-bullseye-slim）
- ✅ Mock 模式运行，无需真实 SAP 连接
- ✅ 自动运行 Prisma 迁移
- ✅ 生产环境优化

**构建过程**:
```
1. 安装系统依赖（OpenSSL）
2. 安装 npm 依赖
3. 生成 Prisma 客户端
4. 构建 Next.js 应用
5. 设置环境变量
6. 暴露 3000 端口
```

### Dockerfile.rfc-server

**用途**: 部署 RFC API 服务器（需要 SAP SDK）

**特点**:
- ✅ 包含完整 SAP NW RFC SDK
- ✅ 构建 node-rfc C++ 扩展
- ✅ 独立的 API 服务器
- ✅ 可与真实 SAP 系统通信

**构建过程**:
```
1. 安装系统依赖（libuuid1, libstdc++6）
2. 复制 SAP SDK 到容器
3. 设置 SAP 环境变量
4. 构建 node-rfc 原生模块
5. 安装 rfc-server 依赖
6. 暴露 3001 端口
```

---

## 🔧 环境变量配置

### Web App 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 随机生成的长字符串 |
| `NEXTAUTH_URL` | 应用 URL | `https://your-app.railway.app` |
| `MOCK_MODE` | 启用 Mock 模式 | `true` |
| `NODE_ENV` | 环境 | `production` |

### Web App 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RFC_SERVER_URL` | RFC Server API 地址 | `http://localhost:3001` |
| `PORT` | 服务端口 | `3000` |

### RFC Server 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | API 端口 | `3001` |
| `NODE_ENV` | 环境 | `production` |

---

## 🔗 服务通信

### 配置 Web App 连接到 RFC Server

在 Railway 中，服务可以通过内部网络通信：

1. 获取 RFC Server 的内部 URL：
   - 在 Railway Dashboard 中打开 RFC Server 服务
   - 复制 "Private Network" 下的 URL（如 `rfc-server.railway.internal:3001`）

2. 在 Web App 中设置环境变量：
   ```bash
   RFC_SERVER_URL=http://rfc-server.railway.internal:3001
   ```

### 网络架构

```
┌─────────────────┐
│   用户浏览器     │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│    Web App      │ (公开访问)
│    (3000)       │
└────────┬────────┘
         │ HTTP (内部网络)
         │
┌────────▼────────┐
│  RFC Server     │ (私有，不对外暴露)
│    (3001)       │
└────────┬────────┘
         │ RFC Protocol
         │
┌────────▼────────┐
│   SAP System    │
└─────────────────┘
```

---

## 📊 资源配置建议

### Web App

- **内存**: 512 MB - 1 GB
- **CPU**: 共享
- **实例数**: 1-2（根据流量）

### RFC Server

- **内存**: 1 GB - 2 GB（因为包含 SAP SDK）
- **CPU**: 共享或专用
- **实例数**: 1-3（根据 RFC 调用频率）

---

## 🗄️ 数据库配置

### 使用 Railway PostgreSQL

1. 在项目中添加 PostgreSQL 插件：
   - 点击 "New" → "Database" → "PostgreSQL"

2. Railway 会自动设置 `DATABASE_URL` 环境变量

3. Web App 会在启动时自动运行迁移：
   ```bash
   npx prisma migrate deploy
   ```

### 外部数据库

如果使用外部 PostgreSQL：

```bash
railway variables set DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## 🚦 部署流程

### 自动部署（推荐）

1. 连接 GitHub 仓库到 Railway
2. 配置好 Dockerfile 路径
3. 每次推送到 main 分支自动触发部署

### 手动部署

```bash
# Web App
railway up --dockerfile Dockerfile.web-app

# RFC Server  
railway up --dockerfile Dockerfile.rfc-server --service rfc-server
```

---

## ✅ 部署检查清单

### 部署前

- [ ] 确认 `Dockerfile.web-app` 存在
- [ ] 确认 `Dockerfile.rfc-server` 存在
- [ ] 确认 `nwrfcsdk/` 目录存在（RFC Server 需要）
- [ ] 准备好所有环境变量

### Web App 部署后

- [ ] 访问健康检查端点：`https://your-app.railway.app/api/health`
- [ ] 测试登录功能
- [ ] 验证数据库连接
- [ ] 检查 Mock 模式是否正常

### RFC Server 部署后

- [ ] 访问健康检查：`https://rfc-server-url/health`
- [ ] 测试 RFC 连接（如果配置了 SAP）
- [ ] 验证从 Web App 的调用

---

## 🐛 故障排除

### 问题 1: 构建失败 - 找不到 Dockerfile

**错误信息**: `failed to read Dockerfile at 'Dockerfile.web-app'`

**解决方案**:
1. 确认文件存在于仓库根目录
2. 检查 Dockerfile 路径配置
3. 确保文件名大小写正确

### 问题 2: Web App 启动失败 - 数据库连接错误

**错误信息**: `Can't reach database server`

**解决方案**:
1. 检查 `DATABASE_URL` 环境变量是否设置
2. 确认 PostgreSQL 插件已添加
3. 检查数据库是否正在运行

### 问题 3: RFC Server 构建失败 - 缺少 SAP SDK

**错误信息**: `COPY failed: file not found in build context`

**解决方案**:
1. 确认 `nwrfcsdk/` 目录存在于仓库根目录
2. 检查 `.gitignore` 是否排除了该目录
3. 如果 SDK 太大，考虑使用 Git LFS

### 问题 4: 服务间通信失败

**错误信息**: `connect ECONNREFUSED`

**解决方案**:
1. 使用内部网络地址：`http://service-name.railway.internal:port`
2. 确认 RFC Server 正在运行
3. 检查防火墙规则

### 问题 5: 内存不足

**错误信息**: `Out of memory` 或服务频繁重启

**解决方案**:
1. 增加服务内存限制
2. 优化 Node.js 内存使用：
   ```bash
   NODE_OPTIONS=--max-old-space-size=512
   ```
3. 实现连接池减少内存占用

---

## 📈 监控和日志

### 查看日志

**Railway Dashboard**:
1. 选择服务
2. 点击 "Deployments"
3. 选择活动部署
4. 查看实时日志

**CLI**:
```bash
# Web App 日志
railway logs

# RFC Server 日志
railway logs --service rfc-server
```

### 健康检查

**Web App**:
```bash
curl https://your-app.railway.app/api/health
```

**RFC Server**:
```bash
curl https://rfc-server-url/health
```

### 性能监控

建议集成监控工具：
- **Sentry** - 错误追踪
- **LogRocket** - 前端监控
- **New Relic** - APM
- **Datadog** - 基础设施监控

---

## 🔒 安全建议

### 1. 环境变量
- ✅ 使用 Railway 的环境变量管理
- ❌ 不要在代码中硬编码密钥
- ✅ 定期轮换密钥

### 2. 网络隔离
- ✅ RFC Server 使用私有网络
- ✅ 只暴露 Web App 到公网
- ✅ 使用内部 URL 进行服务通信

### 3. 认证
- ✅ 启用 NextAuth
- ✅ 使用强密码策略
- ✅ 实现速率限制

### 4. HTTPS
- ✅ Railway 自动提供 SSL 证书
- ✅ 强制 HTTPS 重定向
- ✅ 设置安全头

---

## 💰 成本优化

### 1. 使用 Mock 模式
- Web App 不需要 SAP SDK
- 更小的镜像 = 更快的部署
- 更低的资源消耗

### 2. 按需扩展
- 开发环境：最小配置
- 生产环境：根据实际负载扩展

### 3. 连接池
- 减少 RFC 连接开销
- 重用数据库连接
- 实现智能缓存

### 4. 镜像优化
- 使用多阶段构建
- 清理不必要的文件
- 使用 .dockerignore

---

## 📚 相关文档

- [Railway 官方文档](https://docs.railway.app/)
- [Web App 部署指南](../web-app/DEPLOYMENT_GUIDE.md)
- [RFC Server API 文档](../rfc-server/RFC_SERVER_API.md)
- [项目结构说明](../PROJECT_STRUCTURE.md)

---

## 🎯 快速命令参考

```bash
# 部署 Web App
railway up --dockerfile Dockerfile.web-app

# 部署 RFC Server
railway up --dockerfile Dockerfile.rfc-server --service rfc-server

# 查看日志
railway logs

# 设置环境变量
railway variables set KEY=VALUE

# 打开 Dashboard
railway open

# 查看服务状态
railway status
```

---

*最后更新: 2025年12月21日*
