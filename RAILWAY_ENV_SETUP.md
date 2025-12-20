# Railway 环境变量配置指南

## Web-app Service 必需的环境变量

在 Railway Dashboard → web-app → Variables 页面添加以下环境变量：

### 1. DATABASE_URL（自动生成）
当你将 PostgreSQL service 连接到 web-app 时，Railway 会自动生成这个变量。

**验证**: 在 Variables 页面确认存在：
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 2. NEXTAUTH_URL（必需！）
你的 web-app 的公开访问地址。

**获取方式**:
1. 进入 web-app service
2. 点击 Settings → Networking
3. 在 Public Networking 下点击 "Generate Domain"
4. 复制生成的域名（例如: `web-app-production-1121.up.railway.app`）

**设置**:
```
NEXTAUTH_URL=https://web-app-production-1121.up.railway.app
```

⚠️ **重要**: 必须包含 `https://` 前缀！

### 3. NEXTAUTH_SECRET（必需！）
用于加密 session 的密钥。

**生成方式**:
```bash
openssl rand -base64 32
```

或者直接使用这个：
```
NEXTAUTH_SECRET=7KDxPJ9Qm2Y8vN5wX3zR6tB4sL1fH0gC9eA8dM7nP5oK2jW4iU6yT3rE1qZ0
```

### 4. NODE_ENV（可选但推荐）
```
NODE_ENV=production
```

### 5. RFC_API_URL（可选）
如果你部署了 RFC API Server（node-rfc service），需要设置这个变量指向它：

```
RFC_API_URL=http://node-rfc.railway.internal:3001
```

如果没有部署 RFC API Server，不设置这个变量，系统会使用 Mock 模式。

---

## 完整配置示例

在 Railway Dashboard → web-app → Variables 页面，你应该看到：

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_URL=https://web-app-production-1121.up.railway.app
NEXTAUTH_SECRET=7KDxPJ9Qm2Y8vN5wX3zR6tB4sL1fH0gC9eA8dM7nP5oK2jW4iU6yT3rE1qZ0
NODE_ENV=production
# RFC_API_URL=http://node-rfc.railway.internal:3001  # 可选
```

---

## 配置步骤

### Step 1: 连接 PostgreSQL
1. 在 Railway 项目中，确保 PostgreSQL service 已创建
2. 在 web-app service 页面，点击 "+ Variable"
3. 选择 "Add Reference"
4. 选择 Postgres → DATABASE_URL
5. 点击 "Add"

### Step 2: 生成公开域名
1. 进入 web-app → Settings → Networking
2. 点击 "Generate Domain"
3. 复制生成的域名（例如: `web-app-production-1121.up.railway.app`）

### Step 3: 添加环境变量
1. 进入 web-app → Variables
2. 点击 "+ Variable" → "New Variable"
3. 依次添加：
   - Name: `NEXTAUTH_URL`, Value: `https://your-domain.railway.app`
   - Name: `NEXTAUTH_SECRET`, Value: `<生成的随机字符串>`
   - Name: `NODE_ENV`, Value: `production`

### Step 4: 重新部署
添加/修改环境变量后，Railway 会自动触发重新部署。

---

## 验证部署成功

部署完成后：

### 1. 检查部署日志
在 web-app → Deployments → 最新部署 → Deploy Logs 中，应该看到：

```
Running database migrations...
Checking if admin user exists...
Creating admin user...
Admin user created: username=admin, password=admin123
Starting application...
```

### 2. 检查数据库表
在 Postgres → Database → Data 页面，应该看到以下表：
- `users`
- `sap_connections`
- `call_logs`
- `rfc_templates`
- `_prisma_migrations`

### 3. 访问应用
打开 `https://your-domain.railway.app`：
- 如果环境变量配置正确，会自动跳转到 `/auth/login`
- 如果直接进入主页面，说明 `NEXTAUTH_SECRET` 没有设置

### 4. 登录测试
使用默认管理员账号登录：
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **首次登录后请立即修改密码！**

---

## 常见问题

### Q: 部署后直接进入主页，没有要求登录
**A**: 没有设置 `NEXTAUTH_SECRET` 环境变量。添加后重新部署。

### Q: 数据库里只有 `_prisma_migrations` 表
**A**: `start.sh` 脚本没有执行。检查：
1. Dockerfile 是否正确复制了 `start.sh`
2. `start.sh` 是否有执行权限（`chmod +x`）
3. 查看 Deploy Logs 确认脚本是否运行

### Q: 登录后报错 "Invalid credentials"
**A**: 
1. 确认数据库表已创建
2. 确认 admin 用户已创建（查看 Deploy Logs）
3. 确认使用 username 而不是 email 登录

### Q: 页面显示 "Internal Server Error"
**A**: 查看 Deployments → Logs，检查具体错误信息。常见原因：
- DATABASE_URL 未设置或无效
- 数据库迁移失败
- NEXTAUTH_SECRET 未设置

---

## RFC API Server（可选）

如果要部署完整功能（非 Mock 模式），还需要部署 RFC API Server。

### 环境变量
在 node-rfc service 中设置：

```env
PORT=3001
NODE_ENV=production
```

### 连接两个服务
在 web-app service 的 Variables 中添加：

```env
RFC_API_URL=http://node-rfc.railway.internal:3001
```

**注意**: 
- 使用 Railway 的 Private Networking 地址
- 格式: `http://<service-name>.railway.internal:<port>`
- RFC API Server 不需要公开访问

---

## 安全建议

1. **修改默认密码**: 首次登录后立即修改 admin 用户密码
2. **定期更新 NEXTAUTH_SECRET**: 生产环境应定期轮换密钥
3. **启用 HTTPS**: Railway 自动提供 HTTPS，确保使用 https:// URL
4. **环境变量保密**: 不要将环境变量提交到 Git
5. **数据库备份**: 定期备份 PostgreSQL 数据

---

## 支持

如果遇到问题：
1. 查看 Railway Deploy Logs
2. 查看 Railway Service Logs
3. 检查数据库连接和表结构
4. 确认所有环境变量已正确设置
