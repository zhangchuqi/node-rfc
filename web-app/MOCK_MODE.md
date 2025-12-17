# 🔧 Mock Mode Setup

## 当前状态

目前 web-app 运行在 **MOCK 模式**下，因为：
- SAP NW RFC SDK 尚未安装
- node-rfc C++ 模块无法编译

## Mock 模式功能

✅ **可以正常使用**：
- 所有 UI 界面和页面
- 连接管理（创建、编辑、删除）
- 数据库操作（Prisma + PostgreSQL）
- 前端所有功能

⚠️ **Mock 模拟**：
- 连接测试（总是返回成功）
- RFC 调用（返回模拟数据）
- 不会真正连接到 SAP 系统

## 启用真实 SAP 连接

### 1. 安装 SAP NW RFC SDK

**macOS:**
```bash
# 下载 SAP NW RFC SDK from https://support.sap.com/nwrfcsdk
# 解压到 /usr/local/sap/nwrfcsdk

# 设置环境变量
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=$SAPNWRFC_HOME/lib:$DYLD_LIBRARY_PATH
```

**Linux:**
```bash
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export LD_LIBRARY_PATH=$SAPNWRFC_HOME/lib:$LD_LIBRARY_PATH
```

### 2. 编译 node-rfc

```bash
# 返回父目录
cd ..

# 安装依赖并编译
npm install
npm run build
```

### 3. 恢复真实 SAP 客户端

```bash
cd web-app

# 1. 恢复 package.json 中的 node-rfc 依赖
# 在 dependencies 中添加：
# "node-rfc": "file:../"

# 2. 修改 API 文件，改回使用真实客户端
# 将所有 '@/lib/sap-client-mock' 改为 '@/lib/sap-client'

# 文件列表：
# - app/api/connections/[id]/route.ts
# - app/api/sap/test/route.ts
# - app/api/sap/call/route.ts

# 3. 重新安装依赖
npm install
```

## 当前安装步骤（Mock 模式）

```bash
# 1. 安装依赖（已移除 node-rfc）
npm install

# 2. 配置数据库
createdb saprfc

# 3. 配置环境变量
cp .env.example .env.local

# 4. 运行迁移
npm run prisma:generate
npm run prisma:migrate

# 5. 启动应用
npm run dev
```

## Mock 模式示例输出

当你调用 RFC 函数时，会看到：
```json
{
  "ECHOTEXT": "Hello SAP",
  "RESPTEXT": "Mock SAP response for STFC_CONNECTION",
  "MOCK_MODE": true,
  "CONNECTION": "My Connection Name"
}
```

控制台会显示警告：
```
⚠️ Using MOCK SAP call - node-rfc not installed
```

## 切换回真实模式的快速命令

创建切换脚本后，只需运行：

```bash
# 切换到真实 SAP 模式（需要先安装 SAP NW RFC SDK）
npm run switch:real

# 切换回 Mock 模式
npm run switch:mock
```

## 问题排查

### "sapnwrfc.h not found"
- SAP NW RFC SDK 未安装
- 环境变量 SAPNWRFC_HOME 未设置

### "node-gyp-build: command not found"
- 父项目依赖未安装
- 运行 `cd .. && npm install`

### Mock 数据不够真实？
编辑 `lib/sap-client-mock.ts` 中的返回数据，添加更真实的模拟响应。
