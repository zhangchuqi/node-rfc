# Railway 部署步骤

## 前提条件

1. Railway 账号
2. 项目已推送到 Git（GitHub/GitLab）
3. PostgreSQL 数据库

## 方案选择

### 🎯 方案 1: Mock 模式（演示/开发）

**适用场景**: UI 演示、功能测试（不连接真实 SAP）

**步骤**:

1. **在 Railway 创建项目**
   ```bash
   # 连接你的 GitHub 仓库
   ```

2. **添加 PostgreSQL 数据库**
   - 点击 "New" → "Database" → "Add PostgreSQL"
   - Railway 会自动设置 `DATABASE_URL`

3. **配置环境变量**
   ```
   MOCK_MODE=true
   NEXTAUTH_SECRET=你的密钥（运行 openssl rand -base64 32）
   NEXTAUTH_URL=https://你的应用.railway.app
   NODE_ENV=production
   ```

4. **部署**
   - Railway 会自动检测 `Dockerfile.railway`
   - 等待构建完成
   - 访问生成的 URL

5. **创建管理员用户**
   ```bash
   # 在 Railway 项目中打开 Shell
   cd /app
   npx ts-node scripts/create-user.ts admin@example.com password123 "Admin"
   ```

---

### 🚀 方案 2: 生产模式（真实 SAP 连接）

**前提**: 你需要 SAP NW RFC SDK 文件

#### 步骤 A: 获取 SAP NW RFC SDK

1. 登录 [SAP Service Marketplace](https://launchpad.support.sap.com/)
2. 下载 **SAP NW RFC SDK for Linux x86_64**
3. 解压到项目根目录：
   ```
   node-rfc/
   ├── nwrfcsdk/
   │   ├── include/
   │   └── lib/          # ← 这些 .so 文件是关键
   └── web-app/
   ```

#### 步骤 B: 准备 Dockerfile

根据你的情况选择：

**选项 1: 完整构建（推荐）**
```bash
# 使用 Dockerfile.production
cp web-app/Dockerfile.production web-app/Dockerfile
```

**选项 2: 使用预编译文件**
```bash
# 如果你已经有 prebuilds/linux-x64/
cp web-app/Dockerfile.prebuilt web-app/Dockerfile
```

#### 步骤 C: 创建 .dockerignore

```bash
cat > .dockerignore << EOF
node_modules
.next
.git
.env.local
*.log
.DS_Store
test
doc
examples
EOF
```

#### 步骤 D: 部署到 Railway

1. **推送代码到 Git**
   ```bash
   git add .
   git commit -m "Add Railway deployment"
   git push
   ```

2. **在 Railway 配置**
   - 添加 PostgreSQL 数据库
   - 设置环境变量：
     ```
     NEXTAUTH_SECRET=你的密钥
     NEXTAUTH_URL=https://你的应用.railway.app
     NODE_ENV=production
     ```

3. **触发部署**
   - Railway 会使用 `railway.json` 配置
   - 使用指定的 Dockerfile 构建
   - 自动部署

---

## 替代方案：Docker Compose 本地测试

在部署前，先本地测试：

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: saprfc
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: web-app/Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/saprfc
      NEXTAUTH_SECRET: test-secret-change-in-production
      NEXTAUTH_URL: http://localhost:3000
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

运行：
```bash
docker-compose up --build
```

---

## 常见问题

### Q1: Railway 构建失败 "SAP SDK not found"

**A**: 确保：
1. `nwrfcsdk` 文件夹在项目根目录
2. Dockerfile 中的 COPY 路径正确
3. `.dockerignore` 没有排除 `nwrfcsdk`

### Q2: 运行时错误 "libsapnwrfc.so not found"

**A**: 检查环境变量：
```dockerfile
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$LD_LIBRARY_PATH
```

### Q3: 数据库连接失败

**A**: 确保：
1. Railway PostgreSQL 已添加
2. `DATABASE_URL` 自动注入（无需手动设置）
3. 迁移命令在启动前运行：`npx prisma migrate deploy`

### Q4: Mock 模式下无法测试真实连接

**A**: Mock 模式只用于演示 UI，生产环境必须：
1. 移除 `MOCK_MODE=true`
2. 使用包含 SAP SDK 的 Dockerfile
3. 配置真实的 SAP 连接参数

---

## 推荐部署流程

**开发/演示**: Railway + Mock 模式  
**生产环境**: DigitalOcean/AWS + 真实 SAP SDK

需要更多帮助？检查 `RAILWAY_DEPLOYMENT.md` 了解详细信息。
