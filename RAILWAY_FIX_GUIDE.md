# Railway 部署修复指南

## 问题说明

在 Railway 上调用 RFC_PING 时报错：
```
callRFC is not available in production. Use RFC API Client (rfc-client.ts) to call RFC API Server via HTTP.
```

## 原因

- **web-app** 在 Railway 上以 MOCK 模式部署（没有 SAP RFC SDK）
- 直接调用 `callRFC()` 被禁用
- 需要通过 HTTP 调用独立的 **rfc-server** 服务

## 解决方案：部署两个 Railway 服务

### 架构图

```
┌─────────────────────────────┐
│   Railway Service 1:        │
│   web-app (Next.js)         │
│   - UI 界面                  │
│   - 数据库 (PostgreSQL)      │
│   - MOCK 模式 (无 RFC SDK)   │
└──────────┬──────────────────┘
           │ HTTP
           │ RFC_API_URL
           ▼
┌─────────────────────────────┐
│   Railway Service 2:        │
│   rfc-server (Express)      │
│   - 安装 SAP RFC SDK         │
│   - 直接连接 SAP 系统         │
│   - 提供 HTTP API            │
└─────────────────────────────┘
```

---

## 步骤 1: 部署 rfc-server（RFC API Server）

### 1.1 在 Railway 创建新服务

1. 进入你的 Railway 项目
2. 点击 **"+ New"** → **"GitHub Repo"**
3. 选择 `node-rfc` 仓库
4. 服务名称：`rfc-server`

### 1.2 配置 rfc-server

**Root Directory**: `rfc-server`

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
npm start
```

**Dockerfile**: 使用 `Dockerfile.rfc-server`（已配置）

### 1.3 设置环境变量

在 Railway rfc-server 服务中添加：

```bash
# 服务端口
PORT=3001

# SAP 连接参数（如果需要预配置）
SAP_ASHOST=your-sap-host.com
SAP_SYSNR=00
SAP_USER=your-username
SAP_PASSWD=your-password
SAP_CLIENT=800
SAP_LANG=EN

# Node 环境
NODE_ENV=production
```

### 1.4 部署并获取 URL

1. 点击 **"Deploy"**
2. 部署完成后，进入 **"Settings"** → **"Networking"**
3. 点击 **"Generate Domain"** 生成公开域名
4. 记录域名，例如：`https://rfc-server-production-xxxx.up.railway.app`

### 1.5 测试 rfc-server

```bash
# 健康检查
curl https://your-rfc-server.railway.app/health

# 应该返回：
# {"status":"ok","service":"RFC API Server"}
```

---

## 步骤 2: 配置 web-app 使用 rfc-server

### 2.1 在 web-app 服务添加环境变量

进入你的 **web-app** Railway 服务，添加：

```bash
# RFC API Server URL（重要！）
RFC_API_URL=https://your-rfc-server.railway.app

# 其他现有配置保持不变
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### 2.2 重新部署 web-app

1. 添加环境变量后，Railway 会自动重新部署
2. 或手动触发：**"Deploy"** → **"Redeploy"**

---

## 步骤 3: 验证部署

### 3.1 检查 rfc-server 健康状态

```bash
curl https://your-rfc-server.railway.app/health
```

应返回：
```json
{
  "status": "ok",
  "service": "RFC API Server"
}
```

### 3.2 测试 RFC 连接

```bash
curl -X POST https://your-rfc-server.railway.app/api/rfc/test \
  -H "Content-Type: application/json" \
  -d '{
    "connection": {
      "ashost": "your-sap-host",
      "sysnr": "00",
      "client": "800",
      "user": "your-user",
      "passwd": "your-password",
      "lang": "EN"
    }
  }'
```

### 3.3 在 web-app 中测试

1. 打开 web-app: `https://your-webapp.railway.app`
2. 进入 **"Connections"** 页面
3. 添加或选择一个连接
4. 点击 **"Test Connection"**
5. 应该显示 ✅ **"Connection successful"**

---

## 代码更改说明（已自动完成）

### ✅ 已修复的文件

#### 1. `web-app/app/api/sap/call/route.ts`

添加了自动检测逻辑：
- 如果设置了 `RFC_API_URL`，通过 HTTP 调用 rfc-server
- 否则使用本地直接调用（开发环境）

```typescript
// Helper: 统一 RFC 调用接口
async function executeRFC(
  connection: SAPConnection,
  rfmName: string,
  parameters: Record<string, any>,
  callOptions?: any
): Promise<any> {
  const useAPIClient = process.env.RFC_API_URL;
  
  if (useAPIClient) {
    // 使用 HTTP API 调用 rfc-server
    const sapParams = toSAPParams(connection);
    const response = await callRFCViaAPI({
      connection: sapParams,
      rfmName,
      parameters
    });
    
    if (!response.success) {
      throw new Error(response.error || 'RFC call failed');
    }
    
    return response.data;
  } else {
    // 本地直接调用（开发环境）
    return await callRFCDirect(connection, rfmName, parameters, callOptions);
  }
}
```

#### 2. `web-app/app/api/sap/test/route.ts`

已经使用 `testRFCConnection` from `rfc-api-client.ts`

---

## 环境变量配置总结

### Railway Service 1: web-app

```bash
# 数据库
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-webapp.railway.app

# RFC API Server（必须配置！）
RFC_API_URL=https://your-rfc-server.railway.app

# Node 环境
NODE_ENV=production
```

### Railway Service 2: rfc-server

```bash
# 服务端口
PORT=3001

# SAP 连接（可选，仅用于预配置）
SAP_ASHOST=your-sap-host.com
SAP_SYSNR=00
SAP_USER=your-username
SAP_PASSWD=your-password
SAP_CLIENT=800
SAP_LANG=EN

# Node 环境
NODE_ENV=production
```

---

## 本地开发配置

### 本地 `.env.local` (web-app)

```bash
DATABASE_URL=postgresql://localhost:5432/saprfc
NEXTAUTH_SECRET=your-local-secret
NEXTAUTH_URL=http://localhost:3000

# 本地开发：指向本地 rfc-server
RFC_API_URL=http://localhost:3001
```

### 本地运行

**终端 1 - rfc-server:**
```bash
cd rfc-server
npm start
# 运行在 http://localhost:3001
```

**终端 2 - web-app:**
```bash
cd web-app
npm run dev
# 运行在 http://localhost:3000
```

---

## 故障排查

### 问题 1: "RFC_API_URL environment variable is not set"

**解决**:
- 确保在 web-app Railway 服务中设置了 `RFC_API_URL`
- 重新部署 web-app

### 问题 2: "Connection refused" 或 "ECONNREFUSED"

**解决**:
- 检查 rfc-server 是否正在运行
- 检查 `RFC_API_URL` 格式是否正确（需要完整 URL，包含 https://）
- 测试 rfc-server 健康检查：`curl https://your-rfc-server.railway.app/health`

### 问题 3: "SAP connection failed"

**解决**:
- 确保 rfc-server 可以访问 SAP 系统（网络/防火墙）
- 检查 SAP 连接参数是否正确
- 查看 rfc-server 日志：Railway → rfc-server service → "Deployments" → 点击最新部署 → "View Logs"

### 问题 4: "Build failed: SAP NW RFC SDK not found"

**解决**:
- 确保使用 `Dockerfile.rfc-server`
- 检查 Dockerfile 中 SDK 安装步骤
- 如果使用私有 SDK，需要在 Railway 中配置 secrets

---

## 验证清单

- [ ] rfc-server 服务已部署并运行
- [ ] rfc-server 健康检查返回正常
- [ ] rfc-server 有公开域名
- [ ] web-app 配置了 `RFC_API_URL` 环境变量
- [ ] web-app 已重新部署
- [ ] 在 web-app 中测试连接成功
- [ ] 在 web-app 中可以调用 RFC 函数

---

## 架构优势

这种双服务架构的优势：

1. **安全性**: SAP 凭据仅在 rfc-server 中配置
2. **灵活性**: web-app 不依赖 SAP SDK，部署更快
3. **扩展性**: rfc-server 可独立扩展
4. **监控**: 可单独监控 RFC 调用性能
5. **复用**: rfc-server 可被其他服务调用

---

## 后续优化建议

1. **API 认证**: 为 rfc-server 添加 API Key 认证
   ```typescript
   // rfc-server/index.js
   const API_KEY = process.env.RFC_API_KEY;
   
   app.use((req, res, next) => {
     const apiKey = req.headers['x-api-key'];
     if (apiKey !== API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

2. **连接池**: 实现 SAP 连接池以提高性能
   ```typescript
   const { Pool } = require('node-rfc');
   const pool = new Pool({
     connectionParameters: { /* ... */ },
     poolOptions: { low: 2, high: 10 }
   });
   ```

3. **速率限制**: 添加请求速率限制
   ```bash
   npm install express-rate-limit
   ```

4. **日志记录**: 使用结构化日志
   ```bash
   npm install winston
   ```

5. **监控**: 集成 Railway 指标监控

---

## 费用说明

Railway 免费计划：
- 每月 $5 免费额度
- 两个服务的部署应该在免费额度内
- 超出部分按使用量计费

---

## 支持

如有问题，请查看：
- [RFC Server README](rfc-server/README.md)
- [Web App Deployment Guide](web-app/DEPLOYMENT_GUIDE.md)
- [Railway Documentation](https://docs.railway.app/)

---

**部署成功后，你的 RFC 调用应该可以正常工作了！** 🎉
