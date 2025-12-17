# Railway部署指南

## 项目结构分析

```
node-rfc/                      # 根项目（原生模块库）
├── src/cpp/                   # C++ SAP RFC绑定
├── prebuilds/                 # 预编译二进制文件
│   ├── darwin-arm64/         # macOS Apple Silicon
│   ├── darwin-x64/           # macOS Intel
│   └── linux-x64/            # Linux x86_64 ⭐ Railway需要这个
├── binding.gyp               # node-gyp构建配置
└── web-app/                  # Next.js应用 ⭐ 要部署这个
    ├── package.json
    ├── prisma/
    └── node_modules/
        └── node-rfc -> ../  # 指向父目录
```

## Railway部署挑战

### 🔴 主要问题：SAP NW RFC SDK依赖

**node-rfc是SAP NW RFC SDK的Node.js绑定**，需要：

1. **SAP NW RFC SDK库文件** (必需)
   - 位置：`/usr/local/sap/nwrfcsdk/lib/`
   - 文件：`libsapnwrfc.so`, `libsapucum.so`等
   - 大小：~200-300MB
   - 获取：需要SAP Service Marketplace账号

2. **系统依赖**
   - `libuuid`
   - `libstdc++6`
   - `libgcc1`

3. **环境变量**
   ```bash
   SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
   LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
   ```

### ⚠️ Railway限制

- **不支持自定义构建步骤安装SAP SDK**
- **Nixpacks构建系统无法访问SAP下载**
- **容器不能持久化外部库文件**

## 解决方案对比

### 方案1：Railway + 预编译二进制文件 ⭐ 推荐

**优点**：
- 最简单，无需修改代码
- Railway自动检测Next.js
- 支持PostgreSQL插件

**步骤**：

#### 1. 准备Linux预编译文件

在Linux环境（或Docker）中构建：

```dockerfile
# Dockerfile.build
FROM node:18-bullseye

# 安装SAP NW RFC SDK
COPY nwrfcsdk-linux.zip /tmp/
RUN unzip /tmp/nwrfcsdk-linux.zip -d /usr/local/sap/ && \
    ln -s /usr/local/sap/nwrfcsdk /usr/sap/nwrfcsdk

# 设置环境变量
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib

# 构建node-rfc
WORKDIR /app
COPY package*.json ./
COPY binding.gyp ./
COPY src ./src
RUN npm install --build-from-source

# 输出预编译文件
CMD cp -r prebuilds/linux-x64 /output/
```

构建预编译文件：
```bash
docker build -f Dockerfile.build -t node-rfc-builder .
docker run -v $(pwd)/output:/output node-rfc-builder
```

将`prebuilds/linux-x64/`提交到Git仓库。

#### 2. 创建Railway Dockerfile

```dockerfile
# web-app/Dockerfile
FROM node:18-bullseye-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libuuid1 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# 复制SAP NW RFC SDK库文件
COPY --from=sapnwrfc-base /usr/local/sap/nwrfcsdk/lib/*.so /usr/local/sap/nwrfcsdk/lib/

# 设置环境变量
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV NODE_ENV=production

WORKDIR /app

# 复制依赖文件
COPY web-app/package*.json ./
COPY web-app/prisma ./prisma

# 安装依赖（包括node-rfc预编译版本）
RUN npm ci --only=production

# 复制应用代码
COPY web-app/ .

# 生成Prisma客户端
RUN npx prisma generate

# 构建Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 3. Railway配置

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "web-app/Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 100

[[services]]
name = "web"
```

**问题**：Railway不允许在Dockerfile中包含SAP SDK二进制文件（许可问题）。

---

### 方案2：Railway + Mock模式 ✅ 最可行

**适用场景**：演示、开发、测试环境

**优点**：
- 无需SAP SDK
- 完美支持Railway部署
- 可以展示UI和功能

**缺点**：
- 不能真正连接SAP

**实现**：

```bash
# 在Railway环境变量中设置
MOCK_MODE=true
```

`web-app/lib/sap-client.ts`已经实现了Mock模式逻辑。

---

### 方案3：Heroku (支持Buildpack) ❌ 不推荐

Heroku允许自定义Buildpack，但：
- 价格较贵
- 需要手动编写Buildpack脚本
- 仍需解决SAP SDK许可问题

---

### 方案4：自托管Docker ⭐⭐ 生产环境推荐

**平台选择**：
- DigitalOcean App Platform
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances

**优点**：
- 完全控制环境
- 可以合法包含SAP SDK
- 性能更好

**Dockerfile完整示例**：

```dockerfile
# Dockerfile
FROM node:18-bullseye

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libuuid1 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# 安装SAP NW RFC SDK（假设已有nwrfcsdk.zip）
COPY nwrfcsdk-linux.zip /tmp/
RUN unzip /tmp/nwrfcsdk-linux.zip -d /usr/local/sap/ && \
    rm /tmp/nwrfcsdk-linux.zip

# 设置环境变量
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$LD_LIBRARY_PATH
ENV NODE_ENV=production

WORKDIR /app

# 复制node-rfc
COPY package*.json ./
COPY binding.gyp ./
COPY src ./src
COPY prebuilds ./prebuilds

# 构建node-rfc（如果没有预编译文件）
RUN npm install --build-from-source || npm install

# 复制web-app
COPY web-app/package*.json ./web-app/
COPY web-app/prisma ./web-app/prisma
WORKDIR /app/web-app

# 安装web-app依赖
RUN npm ci

# 复制web-app代码
COPY web-app/ .

# 生成Prisma客户端
RUN npx prisma generate

# 构建Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**部署到Google Cloud Run**：

```bash
# 构建镜像
docker build -t gcr.io/YOUR_PROJECT/sap-rfc-web .

# 推送到GCR
docker push gcr.io/YOUR_PROJECT/sap-rfc-web

# 部署
gcloud run deploy sap-rfc-web \
  --image gcr.io/YOUR_PROJECT/sap-rfc-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...
```

---

### 方案5：混合架构 ⭐⭐⭐ 最佳实践

**架构**：
- **Railway**: 部署Next.js前端（Mock模式）+ PostgreSQL
- **自托管VPS**: 运行SAP RFC代理服务

```
┌─────────────────┐
│   Railway       │
│  ┌───────────┐  │      ┌──────────────────┐
│  │ Next.js   │──┼─────▶│  VPS/EC2         │
│  │ (Mock)    │  │ HTTP │  ┌────────────┐  │      ┌─────────┐
│  └───────────┘  │      │  │ SAP Proxy  │──┼─────▶│   SAP   │
│  ┌───────────┐  │      │  │ (node-rfc) │  │ RFC  │ System  │
│  │PostgreSQL │  │      │  └────────────┘  │      └─────────┘
│  └───────────┘  │      └──────────────────┘
└─────────────────┘
```

**SAP Proxy服务**（在VPS上运行）：

```javascript
// sap-proxy-server.js
const express = require('express');
const { Client } = require('node-rfc');

const app = express();
app.use(express.json());

app.post('/api/sap/call', async (req, res) => {
  const { connection, rfmName, parameters } = req.body;
  
  const client = new Client(connection);
  await client.open();
  const result = await client.call(rfmName, parameters);
  await client.close();
  
  res.json(result);
});

app.listen(8080);
```

**Next.js调用代理**：

```typescript
// web-app/lib/sap-client.ts
const SAP_PROXY_URL = process.env.SAP_PROXY_URL;

export async function callRFC(connection, rfmName, parameters) {
  const response = await fetch(`${SAP_PROXY_URL}/api/sap/call`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SAP_PROXY_TOKEN}`
    },
    body: JSON.stringify({ connection, rfmName, parameters })
  });
  
  return response.json();
}
```

---

## 推荐方案总结

| 方案 | 适用场景 | 难度 | 成本 |
|------|---------|------|------|
| **Mock模式在Railway** | 演示、开发 | ⭐ | 免费/$5 |
| **自托管Docker** | 生产环境 | ⭐⭐⭐ | $20-50/月 |
| **混合架构** | 生产环境 | ⭐⭐⭐⭐ | $10-30/月 |

## Railway部署步骤（Mock模式）

### 1. 准备Railway项目

```bash
cd web-app
railway login
railway init
```

### 2. 添加PostgreSQL

```bash
railway add --plugin postgresql
```

### 3. 设置环境变量

在Railway Dashboard添加：

```env
MOCK_MODE=true
DATABASE_URL=postgresql://... # Railway自动提供
NODE_ENV=production
```

### 4. 配置package.json

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "deploy": "prisma migrate deploy && npm start"
  }
}
```

### 5. 部署

```bash
railway up
```

### 6. 运行数据库迁移

```bash
railway run npx prisma migrate deploy
```

---

## 真实SAP连接的部署（自托管）

### 1. 准备SAP NW RFC SDK

下载Linux版本SDK（需要SAP S-User）：
- 登录 https://support.sap.com/swdc
- 下载 "SAP NW RFC SDK 7.50 for Linux x86_64"

### 2. 创建Dockerfile

```dockerfile
FROM node:18-bullseye

# ... (见上方完整Dockerfile)
```

### 3. 构建并推送

```bash
# 将nwrfcsdk-linux.zip放到项目根目录
docker build -t your-registry/sap-rfc-web:latest .
docker push your-registry/sap-rfc-web:latest
```

### 4. 部署到云平台

**Google Cloud Run**:
```bash
gcloud run deploy sap-rfc-web \
  --image your-registry/sap-rfc-web:latest \
  --add-cloudsql-instances PROJECT:REGION:INSTANCE \
  --set-env-vars DATABASE_URL=...
```

**DigitalOcean App Platform**:
- 在控制台创建新App
- 选择Docker Hub源
- 配置环境变量
- 关联PostgreSQL数据库

---

## 结论

### ✅ Railway可以部署，但有限制：

1. **Mock模式** - 完美支持，适合演示
2. **真实SAP连接** - 不支持，因为SAP SDK依赖问题

### ⭐ 推荐生产方案：

1. **初期/演示**：Railway (Mock模式)
2. **生产环境**：自托管Docker (Google Cloud Run / DigitalOcean)
3. **企业级**：混合架构 (Railway前端 + VPS SAP代理)

### 📋 下一步行动：

如果要部署到Railway：
```bash
cd web-app
echo "MOCK_MODE=true" >> .env.production
railway login
railway init
railway add --plugin postgresql
railway up
```

如果要真实SAP连接，建议使用Google Cloud Run或DigitalOcean App Platform。
