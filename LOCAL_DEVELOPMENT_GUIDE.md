# Node-RFC 本地开发指南

完整的本地开发环境搭建和运行指南。

## 📋 目录

- [系统要求](#系统要求)
- [安装SAP NW RFC SDK](#安装sap-nw-rfc-sdk)
- [编译node-rfc库](#编译node-rfc库)
- [配置Web应用](#配置web应用)
- [启动项目](#启动项目)
- [常见问题](#常见问题)

---

## 系统要求

### 必需软件

- **Node.js**: v18.0.0 或更高（推荐v20+）
- **PostgreSQL**: v14 或更高
- **C++编译器**: 
  - macOS: Xcode Command Line Tools
  - Linux: GCC 7+ 或 Clang
  - Windows: Visual Studio 2019+
- **Python**: v3.8+ (node-gyp依赖)
- **Git**: 用于克隆仓库

### macOS特定

```bash
# 安装Xcode Command Line Tools
xcode-select --install

# 安装Homebrew（如果还没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装PostgreSQL
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
# 安装编译工具
sudo apt-get update
sudo apt-get install -y build-essential python3 nodejs npm postgresql postgresql-contrib

# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 安装SAP NW RFC SDK

### 1. 下载SAP NW RFC SDK

需要SAP S-User账号：

1. 访问 [SAP Support Portal](https://support.sap.com/swdc)
2. 登录你的S-User账号
3. 搜索 "SAP NW RFC SDK"
4. 下载对应平台的版本：
   - **macOS**: `NWRFC_XX-XXXXXXXX_DARWININTEL64.SAR` 或 `_DARWINARM64.SAR`
   - **Linux**: `NWRFC_XX-XXXXXXXX_LINUX_X86_64.SAR`
   - **Windows**: `NWRFC_XX-XXXXXXXX_WIN_X86_64.SAR`

### 2. 解压SAP NW RFC SDK

#### macOS/Linux

```bash
# 如果是.SAR文件，需要先用SAPCAR解压（也在SAP Support Portal下载）
# 这里假设你已经有解压好的nwrfcsdk文件夹

# 创建安装目录
sudo mkdir -p /usr/local/sap

# 复制SDK到安装目录
sudo cp -r /path/to/nwrfcsdk /usr/local/sap/

# 设置权限
sudo chmod -R 755 /usr/local/sap/nwrfcsdk
```

#### Windows

```cmd
# 解压到 C:\nwrfcsdk
# 确保路径没有空格
```

### 3. 配置环境变量

#### macOS (zsh)

编辑 `~/.zshrc`：

```bash
# 打开配置文件
nano ~/.zshrc

# 添加以下内容
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$DYLD_LIBRARY_PATH
export PATH=/usr/local/sap/nwrfcsdk/bin:$PATH

# 保存并生效
source ~/.zshrc
```

#### Linux (bash)

编辑 `~/.bashrc`：

```bash
# 打开配置文件
nano ~/.bashrc

# 添加以下内容
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$LD_LIBRARY_PATH
export PATH=/usr/local/sap/nwrfcsdk/bin:$PATH

# 保存并生效
source ~/.bashrc
```

#### Windows

```cmd
# 设置系统环境变量
setx SAPNWRFC_HOME "C:\nwrfcsdk"
setx PATH "%PATH%;C:\nwrfcsdk\lib"
```

### 4. 验证安装

```bash
# 检查环境变量
echo $SAPNWRFC_HOME

# 检查库文件
ls -la $SAPNWRFC_HOME/lib/

# 应该能看到：
# - libsapnwrfc.dylib (macOS)
# - libsapnwrfc.so (Linux)
# - sapnwrfc.dll (Windows)
# - libsapucum.* (所有平台)
```

---

## 编译node-rfc库

### 1. 克隆项目

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd node-rfc
```

### 2. 安装node-rfc依赖

```bash
# 在项目根目录
npm install

# 如果遇到编译错误，尝试清理重建
npm run clean
npm install --build-from-source
```

### 3. 编译node-rfc

```bash
# 编译TypeScript
npm run ts

# 编译C++绑定（生成预编译文件）
npm run cpp

# 完整构建
npm run build
```

### 4. 验证编译结果

```bash
# 检查预编译文件
ls -la prebuilds/

# macOS应该有: darwin-arm64/ 或 darwin-x64/
# Linux应该有: linux-x64/
# 里面应该有 node.napi.node 文件

# 测试node-rfc
node -e "const rfc = require('./lib/index.js'); console.log('node-rfc loaded successfully');"
```

### 5. 修复动态库路径（macOS特有）

macOS上需要修正预编译文件中的库路径：

```bash
cd prebuilds/darwin-arm64  # 或 darwin-x64

# 修改libsapnwrfc.dylib路径
install_name_tool -change @loader_path/libsapnwrfc.dylib \
  /usr/local/sap/nwrfcsdk/lib/libsapnwrfc.dylib \
  node.napi.node

# 修改libsapucum.dylib路径
install_name_tool -change @loader_path/libsapucum.dylib \
  /usr/local/sap/nwrfcsdk/lib/libsapucum.dylib \
  node.napi.node

# 验证修改
otool -L node.napi.node

# 应该看到绝对路径：
# /usr/local/sap/nwrfcsdk/lib/libsapnwrfc.dylib
# /usr/local/sap/nwrfcsdk/lib/libsapucum.dylib
```

---

## 配置Web应用

### 1. 创建PostgreSQL数据库

```bash
# 创建数据库
createdb saprfc

# 或者使用psql
psql postgres
CREATE DATABASE saprfc;
\q
```

### 2. 进入web-app目录

```bash
cd web-app
```

### 3. 复制node-rfc到web-app

由于web-app依赖父目录的node-rfc，需要手动复制：

```bash
# 创建node_modules目录（如果不存在）
mkdir -p node_modules

# 复制整个node-rfc库
cp -r ../lib ./node_modules/node-rfc/lib
cp -r ../prebuilds ./node_modules/node-rfc/prebuilds
cp ../package.json ./node_modules/node-rfc/

# 或者创建符号链接（macOS/Linux）
# ln -s ../../../ ./node_modules/node-rfc
```

### 4. 安装web-app依赖

```bash
# 安装npm包
npm install
```

### 5. 配置环境变量

创建 `.env` 文件：

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
nano .env
```

`.env` 内容：

```env
# 数据库连接
DATABASE_URL="postgresql://chengzhang@localhost:5432/saprfc"

# 如果PostgreSQL需要密码
# DATABASE_URL="postgresql://username:password@localhost:5432/saprfc"

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SAP连接配置（可选，用于测试）
SAP_HOST=34.130.95.113
SAP_SYSNR=00
SAP_CLIENT=600
SAP_USER=inossem
SAP_PASSWORD=your_password

# Mock模式（开发时可以设置为true跳过SAP连接）
# MOCK_MODE=false
```

### 6. 初始化数据库

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 查看数据库（可选）
npx prisma studio
```

验证数据库表已创建：

```bash
psql saprfc

# 查看表
\dt

# 应该看到：
# - SAPConnection
# - CallLog

\q
```

---

## 启动项目

### 开发模式

```bash
# 在 web-app 目录
npm run dev
```

访问 http://localhost:3000

### 生产模式

```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

---

## 项目结构说明

```
node-rfc/
├── src/
│   ├── cpp/                    # C++ SAP RFC绑定源码
│   └── ts/                     # TypeScript包装层
├── lib/                        # 编译后的JavaScript
├── prebuilds/                  # 预编译的原生模块
│   ├── darwin-arm64/          # macOS Apple Silicon
│   │   └── node.napi.node    # ⭐ 关键：原生C++模块
│   └── linux-x64/             # Linux
├── binding.gyp                 # node-gyp构建配置
├── package.json                # node-rfc库配置
└── web-app/                    # Next.js Web应用
    ├── app/                   # Next.js页面
    │   ├── page.tsx          # 首页
    │   ├── connections/      # SAP连接管理
    │   ├── call/             # RFC调用界面
    │   └── logs/             # 调用日志
    ├── components/            # React组件
    │   └── DynamicForm.tsx   # 动态表单组件
    ├── lib/                   # 工具库
    │   └── sap-client.ts     # SAP连接客户端
    ├── prisma/                # 数据库Schema
    │   └── schema.prisma
    └── node_modules/
        └── node-rfc/         # ⭐ 复制的node-rfc（web-app专用）
```

---

## 使用指南

### 1. 添加SAP连接

访问 http://localhost:3000/connections

点击"新增连接"，填写：
- **名称**: 测试连接
- **Host**: 34.130.95.113
- **系统编号**: 00
- **Client**: 600
- **用户名**: inossem
- **密码**: your_password

点击"测试连接"验证。

### 2. 调用SAP函数

访问 http://localhost:3000/call

1. 选择SAP连接
2. 输入函数名（如 `STFC_CONNECTION`）
3. 点击"加载参数结构"
4. 填写参数（Import/Export/Changing/Tables分组显示）
5. 点击"执行"

### 3. 查看调用日志

访问 http://localhost:3000/logs

查看所有RFC调用的历史记录。

---

## 常见问题

### 1. `Error: sapnwrfc.node not found`

**原因**: node-rfc的原生模块未正确编译或路径错误。

**解决**:

```bash
# 重新编译
cd /Users/chengzhang/Downloads/Github/node-rfc
npm run clean
npm install --build-from-source

# 检查预编译文件
ls -la prebuilds/darwin-arm64/node.napi.node

# 重新复制到web-app
cd web-app
rm -rf node_modules/node-rfc
mkdir -p node_modules/node-rfc
cp -r ../lib node_modules/node-rfc/
cp -r ../prebuilds node_modules/node-rfc/
cp ../package.json node_modules/node-rfc/
```

### 2. `dyld: Library not loaded: @loader_path/libsapnwrfc.dylib`

**原因**: macOS动态库路径未修正。

**解决**:

```bash
cd prebuilds/darwin-arm64

# 修正路径
install_name_tool -change @loader_path/libsapnwrfc.dylib \
  /usr/local/sap/nwrfcsdk/lib/libsapnwrfc.dylib \
  node.napi.node

install_name_tool -change @loader_path/libsapucum.dylib \
  /usr/local/sap/nwrfcsdk/lib/libsapucum.dylib \
  node.napi.node

# 验证
otool -L node.napi.node
```

### 3. `Error: SAPNWRFC_HOME not set`

**原因**: 环境变量未正确设置。

**解决**:

```bash
# 检查环境变量
echo $SAPNWRFC_HOME

# 如果为空，编辑配置文件
nano ~/.zshrc  # 或 ~/.bashrc

# 添加
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$DYLD_LIBRARY_PATH

# 重新加载
source ~/.zshrc

# 重启终端，再次检查
echo $SAPNWRFC_HOME
```

### 4. `Prisma Client not found`

**原因**: Prisma客户端未生成。

**解决**:

```bash
cd web-app
npx prisma generate
```

### 5. `Database connection failed`

**原因**: PostgreSQL未启动或数据库不存在。

**解决**:

```bash
# 检查PostgreSQL状态
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# 启动PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux

# 创建数据库
createdb saprfc

# 验证连接
psql saprfc -c "SELECT version();"
```

### 6. `RFC_COMMUNICATION_FAILURE`

**原因**: SAP系统无法连接。

**检查**:

1. 网络连通性：`ping 34.130.95.113`
2. 防火墙规则
3. SAP系统端口（通常是 `33<SYSNR>`，如3300）
4. 用户名密码是否正确
5. Client是否正确

### 7. 端口3000已被占用

**解决**:

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用其他端口
PORT=3001 npm run dev
```

### 8. TypeScript类型错误

**原因**: node-rfc的类型定义不完整。

**解决**:

在需要的地方添加类型断言：

```typescript
const result = await client.call(rfmName, parameters) as any;
```

或创建 `node-rfc.d.ts` 类型定义文件。

---

## 开发工具

### 推荐的VS Code扩展

- **Prisma**: 数据库schema语法高亮
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Thunder Client**: API测试
- **GitLens**: Git增强

### 有用的命令

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma migrate reset

# 格式化代码
npm run format

# 类型检查
npm run type-check

# 查看node-rfc版本
node -e "console.log(require('./lib/index.js').version)"

# 测试SAP连接（命令行）
node -e "
const { Client } = require('./lib/index.js');
const client = new Client({
  host: '34.130.95.113',
  sysnr: '00',
  client: '600',
  user: 'inossem',
  passwd: 'your_password'
});
client.open().then(() => {
  console.log('✅ SAP连接成功');
  return client.close();
}).catch(err => {
  console.error('❌ SAP连接失败:', err.message);
});
"
```

---

## 性能优化建议

### 1. 使用连接池

在生产环境使用连接池避免频繁创建连接：

```typescript
import { Pool } from 'node-rfc';

const pool = new Pool({
  connectionParameters: { /* ... */ },
  poolOptions: {
    min: 2,
    max: 10
  }
});
```

### 2. 启用压缩

对于大数据传输，启用压缩：

```typescript
const client = new Client({
  // ...
  trace: '0',
  compression: true
});
```

### 3. 数据库索引

为常用查询添加索引：

```prisma
model CallLog {
  // ...
  @@index([createdAt])
  @@index([rfmName])
  @@index([status])
}
```

---

## 安全建议

1. **不要提交敏感信息**
   - 将 `.env` 添加到 `.gitignore`
   - 使用环境变量存储密码

2. **使用HTTPS**
   - 生产环境启用SSL/TLS
   - 使用安全的Cookie设置

3. **限制API访问**
   - 添加认证中间件
   - 实现速率限制

4. **定期更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

---

## 更新node-rfc

```bash
# 获取最新代码
git pull

# 更新依赖
npm install

# 重新编译
npm run build

# 更新web-app
cd web-app
npm install
npx prisma generate
npx prisma migrate deploy
```

---

## 获取帮助

- **node-rfc文档**: https://github.com/SAP/node-rfc
- **SAP Community**: https://community.sap.com
- **项目Issues**: 在GitHub仓库创建Issue

---

## 快速启动清单

```bash
# 1. 安装SAP NW RFC SDK
sudo cp -r nwrfcsdk /usr/local/sap/
echo 'export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk' >> ~/.zshrc
echo 'export DYLD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$DYLD_LIBRARY_PATH' >> ~/.zshrc
source ~/.zshrc

# 2. 编译node-rfc
cd /Users/chengzhang/Downloads/Github/node-rfc
npm install
npm run build

# 3. 修复动态库（macOS）
cd prebuilds/darwin-arm64
install_name_tool -change @loader_path/libsapnwrfc.dylib /usr/local/sap/nwrfcsdk/lib/libsapnwrfc.dylib node.napi.node
install_name_tool -change @loader_path/libsapucum.dylib /usr/local/sap/nwrfcsdk/lib/libsapucum.dylib node.napi.node

# 4. 配置web-app
cd ../../web-app
mkdir -p node_modules/node-rfc
cp -r ../lib ../prebuilds ../package.json node_modules/node-rfc/
npm install

# 5. 设置数据库
createdb saprfc
echo 'DATABASE_URL="postgresql://chengzhang@localhost:5432/saprfc"' > .env
npx prisma migrate dev

# 6. 启动应用
npm run dev
```

访问 http://localhost:3000 🎉
