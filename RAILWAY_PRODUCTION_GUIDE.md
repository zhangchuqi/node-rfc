# 🚀 Railway 生产环境部署快速指南

## ✅ 准备工作已完成

- [x] Linux SAP RFC SDK 已安装到 `nwrfcsdk/`
- [x] Dockerfile 配置完成
- [x] railway.json 已设置

## 📋 部署步骤

### 1. 生成 NextAuth 密钥

```bash
openssl rand -base64 32
```

保存输出的密钥，待会要用。

### 2. 推送代码到 Git

```bash
# 使用部署脚本（推荐）
./deploy-railway.sh

# 或者手动
git add .
git commit -m "Deploy to Railway with SAP SDK"
git push
```

### 3. 在 Railway 创建项目

1. 访问 [railway.app](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 `node-rfc` 仓库

### 4. 添加 PostgreSQL 数据库

1. 在项目中点击 "New" → "Database" → "Add PostgreSQL"
2. Railway 会自动设置 `DATABASE_URL` 环境变量

### 5. 设置环境变量

在项目设置 → Variables 中添加：

```
NEXTAUTH_SECRET=<步骤1生成的密钥>
NEXTAUTH_URL=https://你的应用.railway.app
NODE_ENV=production
```

### 6. 等待构建

- 首次构建可能需要 **5-10 分钟**（因为要编译 SAP SDK）
- 在 Deployments 标签查看构建日志

### 7. 创建管理员用户

构建成功后：

1. 点击项目 → Settings → Open Shell
2. 运行：
   ```bash
   npx ts-node scripts/create-user.ts admin@example.com yourpassword "Admin User"
   ```

### 8. 访问应用

点击生成的 URL，用管理员账号登录！

---

## 🔧 常见问题

### Q: 构建失败 "Cannot find module 'node-rfc'"

**A**: 检查 Dockerfile 中的路径，确保正确复制了 node-rfc

### Q: 运行时错误 "libsapnwrfc.so: cannot open shared object file"

**A**: 检查环境变量：
```dockerfile
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$LD_LIBRARY_PATH
```

### Q: 数据库连接失败

**A**: 确保：
- Railway PostgreSQL 已添加
- 在部署日志中看到 `prisma migrate deploy` 成功执行

### Q: 登录后重定向错误

**A**: 检查 `NEXTAUTH_URL` 是否正确设置为你的 Railway 应用 URL

---

## 📊 部署后监控

### 查看日志
```bash
# 在 Railway 项目中
Deployments → 选择部署 → View Logs
```

### 数据库管理
```bash
# Railway 项目中打开 Shell
npx prisma studio
```

### 性能监控
- Railway Dashboard 显示 CPU、内存使用
- 在 Observability 标签查看详细指标

---

## 🔄 后续更新

推送新代码时，Railway 会自动重新构建部署：

```bash
git add .
git commit -m "Update feature"
git push
```

---

## 💡 优化建议

### 1. 使用预编译文件加速构建

首次构建成功后，可以：
1. 导出 `node_modules/node-rfc/build` 
2. 作为 prebuild 提交
3. 修改 Dockerfile 跳过编译步骤

### 2. 数据库备份

```bash
# 定期备份
pg_dump $DATABASE_URL > backup.sql
```

### 3. 环境隔离

考虑创建：
- `main` 分支 → 生产环境
- `staging` 分支 → 测试环境

Railway 可以为不同分支创建独立部署。

---

需要帮助？查看 [Railway 文档](https://docs.railway.app) 或项目的 `RAILWAY_DEPLOYMENT.md`
