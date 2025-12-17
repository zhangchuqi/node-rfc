# SAP RFC Web Manager - 项目概览

一个功能完整的全栈 Web 应用，用于管理 SAP RFC 连接并执行远程函数调用。

## 🎯 已实现功能

### ✅ 核心功能
- **连接管理**：创建、编辑、删除 SAP 连接配置
- **连接类型选择**：支持 CLIENT（直连）和 POOL（连接池）两种模式
- **连接测试**：创建前可测试连接是否可用
- **RFC 调用**：通过 Web 界面直接调用 SAP 函数模块
- **调用历史**：记录所有 RFC 调用，包括参数、结果、执行时间、状态
- **日志过滤**：按连接、状态筛选调用历史
- **分页显示**：调用历史支持分页浏览

### ✅ 技术栈
- **前端**：Next.js 15 (App Router) + React 19 + TypeScript
- **UI 组件**：shadcn/ui (基于 Radix UI + Tailwind CSS)
- **后端**：Next.js API Routes
- **数据库**：PostgreSQL + Prisma ORM
- **SAP 连接**：node-rfc (parent project)

### ✅ 用户体验
- 🎨 现代化的深色/浅色主题 UI
- 📱 响应式设计（桌面优先）
- ⚡ 快速的页面加载和交互
- 🔍 实时 JSON 参数编辑和验证
- 📊 清晰的状态指示（成功/失败/超时）
- 🎯 常用函数快捷按钮

## 📁 项目结构

```
web-app/
├── app/                          # Next.js App Router
│   ├── api/                      # 后端 API
│   │   ├── connections/          # 连接管理 CRUD
│   │   │   ├── route.ts          # GET (列表), POST (创建)
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE (单个连接)
│   │   ├── sap/                  # SAP 操作
│   │   │   ├── test/route.ts     # 测试连接
│   │   │   └── call/route.ts     # 执行 RFC 调用
│   │   └── logs/route.ts         # 调用历史查询
│   ├── connections/              # 连接管理页面
│   │   ├── page.tsx              # 连接列表
│   │   └── new/page.tsx          # 新建连接
│   ├── call/page.tsx             # RFC 调用页面
│   ├── logs/page.tsx             # 调用历史页面
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── globals.css               # 全局样式
├── components/ui/                # shadcn/ui 组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── select.tsx
│   └── badge.tsx
├── lib/
│   ├── prisma.ts                 # Prisma 客户端单例
│   ├── sap-client.ts             # SAP 连接工具
│   └── utils.ts                  # 工具函数
├── prisma/
│   └── schema.prisma             # 数据库模型定义
├── .env.example                  # 环境变量模板
├── next.config.ts                # Next.js 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── package.json                  # 依赖配置
├── README.md                     # 完整文档
├── QUICKSTART.md                 # 快速开始指南
└── FURTHER_CONSIDERATIONS.md     # 未来改进计划
```

## 🗄️ 数据库模型

### SAPConnection（SAP 连接配置）
```prisma
- id: UUID
- name: 连接名称（唯一）
- connectionType: CLIENT | POOL
- host: SAP 服务器地址
- systemNumber: 系统编号
- client: 客户端编号
- user: 用户名
- password: 密码（明文，建议加密）
- language: 语言代码
- poolOptions: JSON（连接池配置）
- clientOptions: JSON（客户端选项）
- isActive: 是否激活
- description: 描述
- timestamps: 创建/更新时间
```

### CallLog（调用日志）
```prisma
- id: UUID
- connectionId: 关联的连接 ID
- rfmName: 函数模块名称
- parameters: JSON（输入参数）
- result: JSON（输出结果）
- duration: 执行时长（毫秒）
- status: SUCCESS | ERROR | TIMEOUT | CANCELLED
- errorMessage: 错误消息
- errorCode: 错误代码
- errorKey: SAP 错误键
- calledAt: 调用时间
```

## 🔌 API 端点

### 连接管理
- `GET /api/connections` - 获取所有连接
- `POST /api/connections` - 创建新连接
- `GET /api/connections/[id]` - 获取连接详情
- `PUT /api/connections/[id]` - 更新连接
- `DELETE /api/connections/[id]` - 删除连接

### SAP 操作
- `POST /api/sap/test` - 测试连接（不保存）
- `POST /api/sap/call` - 执行 RFC 调用并记录日志

### 日志查询
- `GET /api/logs?connectionId=xxx&status=xxx&page=1&limit=20` - 查询调用历史

## 🚀 快速开始

### 1. 安装依赖
```bash
cd web-app
npm install
```

### 2. 配置数据库
```bash
# 创建数据库
createdb saprfc

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 设置 DATABASE_URL
```

### 3. 初始化数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动应用
```bash
npm run dev
```

访问 http://localhost:3000 🎉

## 📸 页面预览

### 首页
- 三个主要功能入口卡片
- 简洁的导航界面

### 连接管理
- 表格展示所有连接
- 显示连接类型、状态、调用次数
- 快速编辑/删除操作

### 新建连接
- 表单输入连接参数
- 连接类型切换（Client/Pool）
- 测试连接功能
- Pool 类型显示额外配置

### RFC 调用
- 左侧：连接选择、函数名、参数输入
- 右侧：实时显示调用结果
- 常用函数快捷按钮
- JSON 格式化显示

### 调用历史
- 过滤器（连接、状态）
- 分页表格显示
- 状态徽章（成功/失败）
- 执行时间统计

## 🔑 核心功能实现

### 连接缓存机制
```typescript
// lib/sap-client.ts
const connectionCache = new Map<string, Client | Pool>();

export async function getSAPConnection(connection: SAPConnection) {
  // 检查缓存
  if (connectionCache.has(connection.id)) {
    return connectionCache.get(connection.id);
  }
  
  // 创建新连接并缓存
  const client = connection.connectionType === 'POOL' 
    ? new Pool({ ... })
    : new Client({ ... });
  
  connectionCache.set(connection.id, client);
  return client;
}
```

### RFC 调用流程
1. 前端提交：连接 ID + 函数名 + 参数
2. 后端验证：检查连接是否存在且激活
3. 获取连接：从缓存获取或创建新连接
4. 执行调用：Client.call() 或 Pool.acquire().call()
5. 记录日志：保存参数、结果、耗时、状态到数据库
6. 返回结果：JSON 格式返回给前端

## 📋 待实现功能（见 FURTHER_CONSIDERATIONS.md）

### 🔴 高优先级
- [ ] 密码加密存储
- [ ] 用户认证与授权
- [ ] API 输入验证
- [ ] 连接池健康监控

### 🟡 中优先级
- [ ] React Query 数据缓存
- [ ] 连接池 LRU 缓存
- [ ] Docker 容器化
- [ ] 错误重试机制

### 🟢 低优先级
- [ ] 仪表盘与统计图表
- [ ] 批量操作
- [ ] SAP Server 模式
- [ ] 国际化支持

## 🛡️ 安全注意事项

⚠️ **当前版本适用于开发/测试环境，生产环境需要：**

1. **加密密码**：使用 AES-256 加密存储
2. **添加认证**：实现用户登录系统
3. **HTTPS**：使用 SSL/TLS 加密传输
4. **限流**：防止 API 滥用
5. **审计日志**：记录所有操作
6. **环境隔离**：开发/生产数据库分离

## 📚 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [shadcn/ui 组件](https://ui.shadcn.com/)
- [node-rfc 文档](../README.md)
- [SAP RFC SDK 文档](https://support.sap.com/nwrfcsdk)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

与父项目 node-rfc 相同的许可证。

---

**开发者**: AI 助手  
**日期**: 2025-12-16  
**版本**: 1.0.0
