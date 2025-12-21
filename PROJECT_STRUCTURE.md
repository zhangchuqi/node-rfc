# Node-RFC 项目文档结构

## 项目概述

**node-rfc** 是一个为 Node.js 提供的 SAP NetWeaver RFC SDK 的异步、非阻塞客户端和服务器绑定库。它允许从 Node.js 直接调用 ABAP 业务逻辑，并使用 Node.js 功能扩展 ABAP 生态系统，自动完成 ABAP ↔ Node.js 数据转换。

- **版本**: 3.3.1
- **许可证**: Apache-2.0
- **仓库**: https://github.com/sap/node-rfc
- **主要作者**: Srdjan Boskovic (SAP)
- **注意**: 此公共仓库已不再维护

---

## 核心目录结构

### 📂 根目录文件

| 文件 | 说明 |
|------|------|
| `package.json` | 主项目配置，定义依赖、脚本和发布信息 |
| `binding.gyp` | Node.js 原生模块构建配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `jest.config.js` | Jest 测试框架配置 |
| `typedoc.json` | TypeDoc API 文档生成配置 |
| `Doxyfile` | Doxygen C++ 文档生成配置 |
| `README.md` | 项目主文档，包含快速入门和概述 |

### 📚 源代码目录

#### 📁 `src/` - 源代码
- **`src/cpp/`** - C++ 原生绑定代码
  - SAP NW RFC SDK 的 N-API 绑定实现
  - 客户端和服务器的底层实现
  
- **`src/ts/`** - TypeScript 源代码
  - 高级 API 封装
  - 类型定义
  - 客户端、连接池、服务器、吞吐量监控等实现

#### 📁 `lib/` - 编译后的 JavaScript 代码
已编译的输出目录，包含：
- `index.js` / `index.d.ts` - 主入口点
- `noderfc-bindings.js` / `.d.ts` - 原生绑定接口
- `sapnwrfc-client.js` / `.d.ts` - RFC 客户端
- `sapnwrfc-pool.js` / `.d.ts` - 连接池
- `sapnwrfc-server.js` / `.d.ts` - RFC 服务器
- `sapnwrfc-throughput.js` / `.d.ts` - 吞吐量监控

#### 📁 `build/` - 构建输出
- 原生模块编译产物
- Makefile 和构建配置
- `build/Release/` - 发布版本二进制文件

#### 📁 `prebuilds/` - 预编译二进制文件
- `darwin-arm64/` - macOS ARM64 预编译版本
- 其他平台的预编译版本（按需）

---

### 🧪 测试目录

#### 📁 `test/` - 完整测试套件
```
test/
├── README.md                      # 测试说明
├── tsconfig.json                  # 测试专用 TypeScript 配置
├── addon.methods.spec.ts          # 插件方法测试
├── call_options/                  # 调用选项测试
├── cancel/                        # 取消操作测试
├── client/                        # 客户端功能测试
├── concurrency/                   # 并发测试
├── datatypes/                     # 数据类型转换测试
├── errors/                        # 错误处理测试
├── locking/                       # 锁定机制测试
├── performance/                   # 性能测试
├── pool/                          # 连接池测试
├── throughput/                    # 吞吐量测试
└── utils/                         # 测试工具
```

---

### 📖 文档目录

#### 📁 `doc/` - 用户文档（Markdown）
- `api.md` - API 参考文档
- `authentication.md` - 认证方式说明
- `env.md` - 环境变量配置
- `installation.md` - 安装指南
- `troubleshooting.md` - 故障排除
- `usage.md` - 使用指南
- `assets/` - 文档资源文件

#### 📁 `docs/` - 生成的 API 文档
```
docs/
├── README.md                      # 文档索引
├── api/                          # TypeDoc 生成的 API 文档
├── contributing/                 # 贡献指南
├── deployment/                   # 部署文档
└── guides/                       # 使用指南
```

---

### 💡 示例目录

#### 📁 `examples/` - 使用示例
- `README.md` - 示例说明
- `server_functions.ts` - 服务器函数示例
- `server-test-blog.mjs` - 服务器测试博客示例
- `server.ts` - 服务器示例
- `zserver_stfc_connection.abap` - ABAP 连接示例
- `zserver_stfc_struct.abap` - ABAP 结构示例

---

### 🌐 Web 应用程序

#### 📁 `web-app/` - Next.js Web 应用
基于 Next.js 的 SAP RFC Web 管理界面

```
web-app/
├── package.json                   # Web 应用依赖
├── next.config.ts                 # Next.js 配置
├── tsconfig.json                  # TypeScript 配置
├── tailwind.config.ts             # Tailwind CSS 配置
├── components.json                # shadcn/ui 组件配置
├── middleware.ts                  # Next.js 中间件
│
├── app/                          # Next.js App Router
├── components/                    # React 组件
├── lib/                          # 工具函数和配置
├── prisma/                       # Prisma ORM 模式
├── public/                       # 静态资源
├── scripts/                      # 辅助脚本
│
├── README.md                     # Web 应用说明
├── QUICKSTART.md                 # 快速入门
├── PROJECT_OVERVIEW.md           # 项目概述
├── ARCHITECTURE_REVIEW.md        # 架构审查
├── AUTH_README.md                # 认证说明
├── DEPLOYMENT_GUIDE.md           # 部署指南
├── MOCK_MODE.md                  # Mock 模式说明
├── RFC_SDK_INSTALLED.md          # RFC SDK 安装说明
├── WORKFLOW_*.md                 # 工作流文档
│
├── Dockerfile.*                  # Docker 配置文件
├── railway.json                  # Railway 部署配置
└── start*.sh                     # 启动脚本
```

**功能特性**：
- 用户认证和授权 (Prisma + SQLite/PostgreSQL)
- SAP RFC 连接管理
- RFC 函数调用界面
- 工作流管理系统
- Mock 模式支持（无需实际 SAP 连接）

---

### 🖥️ RFC API 服务器

#### 📁 `rfc-server/` - Express API 服务器
独立的 RFC API 服务器，提供 RESTful API

```
rfc-server/
├── package.json                   # 服务器依赖
├── index.js                      # 服务器主入口
└── README.md                     # 服务器说明
```

**功能**：
- Express.js RESTful API
- CORS 支持
- RFC 函数调用端点
- 可独立部署

---

### 🏗️ 构建和部署

#### 📁 `docker/` - Docker 配置
容器化配置文件

#### 根目录 Dockerfile 文件
- `Dockerfile` - 基础 Docker 镜像
- `Dockerfile.rfc-server` - RFC 服务器专用镜像
- `Dockerfile.simple` - 简化版镜像
- `Dockerfile.web-app` - Web 应用镜像

#### 部署脚本
- `deploy-railway.sh` - Railway 平台部署脚本

---

### 📦 依赖和 SDK

#### 📁 `nwrfcsdk/` - SAP NW RFC SDK
SAP NetWeaver RFC SDK 文件

```
nwrfcsdk/
├── bin/                          # 可执行文件
├── demo/                         # SDK 示例
├── doc/                          # SDK 文档
├── include/                      # C/C++ 头文件
└── lib/                          # 共享库
```

#### 📁 `sap_sdk/` - SAP SDK 签名
- `SIGNATURE.SMF` - SDK 数字签名文件

#### 📁 `LICENSES/` - 许可证文件
- `Apache-2.0.txt` - Apache 2.0 许可证全文

---

### 📜 脚本目录

#### 📁 `scripts/` - 辅助脚本
构建、部署和维护脚本

---

## 文档分类说明

### 1️⃣ 用户文档
- **入门**: `README.md`, `doc/installation.md`
- **使用指南**: `doc/usage.md`, `doc/authentication.md`
- **API 参考**: `doc/api.md`, `docs/api/`
- **故障排除**: `doc/troubleshooting.md`

### 2️⃣ 开发者文档
- **贡献指南**: `CONTRIBUTING.md`, `docs/contributing/`
- **本地开发**: `LOCAL_DEVELOPMENT_GUIDE.md`
- **代码规范**: `CODE_OF_CONDUCT.md`
- **重构总结**: `REFACTORING_SUMMARY.md`

### 3️⃣ 部署文档
- **Docker**: `Dockerfile.*`, `docker/`
- **Railway**: `RAILWAY_*.md`, `railway.json`
- **通用部署**: `DEPLOYMENT_GUIDE.md`

### 4️⃣ Web 应用文档
位于 `web-app/` 目录，包括：
- 快速入门和架构文档
- 认证系统说明
- 工作流实现指南
- 部署和运维文档

### 5️⃣ 变更日志和发布
- `CHANGELOG.md` - 版本变更历史
- `SECURITY.md` - 安全政策

---

## 关键技术栈

### 核心库 (node-rfc)
- **语言**: C++, TypeScript, JavaScript
- **运行时**: Node.js (N-API v8)
- **构建工具**: node-gyp, TypeScript
- **测试**: Jest
- **文档**: TypeDoc, Doxygen

### Web 应用 (web-app)
- **框架**: Next.js 14+ (App Router)
- **UI**: React, Tailwind CSS, shadcn/ui
- **数据库**: Prisma ORM (SQLite/PostgreSQL)
- **认证**: 自定义认证系统
- **部署**: Docker, Railway

### RFC API 服务器 (rfc-server)
- **框架**: Express.js
- **中间件**: CORS
- **依赖**: node-rfc

---

## 开发工作流

### 构建流程
1. TypeScript 编译: `src/ts/` → `lib/`
2. C++ 原生模块编译: `src/cpp/` → `build/Release/`
3. 预编译二进制: → `prebuilds/`

### 测试流程
```bash
npm test              # 运行所有测试
npm run test:watch    # 监视模式
```

### Web 应用开发
```bash
cd web-app
npm run dev           # 开发服务器
npm run build         # 生产构建
npm run prisma:studio # 数据库管理
```

### RFC 服务器运行
```bash
cd rfc-server
npm start             # 启动 API 服务器
```

---

## 环境配置

### 必需的环境变量
详见 `doc/env.md`
- `NODE_RFC_MODULE_PATH` - RFC SDK 路径
- SAP 连接参数
- 数据库连接字符串 (web-app)

### 配置文件
- `.env` / `.env.local` - 环境变量
- `sapnwrfc.ini` - SAP RFC 配置
- `prisma/schema.prisma` - 数据库模式

---

## 快速导航

### 我想...
- **安装和使用 node-rfc** → [`README.md`](README.md), [`doc/installation.md`](doc/installation.md)
- **查看 API 文档** → [`doc/api.md`](doc/api.md)
- **运行示例代码** → [`examples/README.md`](examples/README.md)
- **贡献代码** → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **使用 Web 界面** → [`web-app/README.md`](web-app/README.md)
- **部署到生产环境** → [`DEPLOYMENT_GUIDE.md`](web-app/DEPLOYMENT_GUIDE.md)
- **解决问题** → [`doc/troubleshooting.md`](doc/troubleshooting.md)
- **了解架构** → [`web-app/ARCHITECTURE_REVIEW.md`](web-app/ARCHITECTURE_REVIEW.md)

---

## 维护状态

⚠️ **重要提示**: 此项目已不再由 SAP 积极维护。详情请参阅 [GitHub Issue #329](https://github.com/SAP/node-rfc/issues/329)。

---

## 联系和资源

- **GitHub**: https://github.com/sap/node-rfc
- **NPM**: https://www.npmjs.com/package/node-rfc
- **示例仓库**: https://github.com/SAP-samples/node-rfc-samples
- **SAP NW RFC SDK**: https://support.sap.com/en/product/connectors/nwrfcsdk.html

---

*最后更新: 2025年12月*
