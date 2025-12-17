# ✅ SAP NW RFC SDK 安装完成！

## 安装位置
- **SDK 路径**: `/usr/local/sap/nwrfcsdk`
- **版本**: 7.50 Patch 18

## 环境变量（已配置）

已添加到 `~/.zshrc`:
```bash
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=$SAPNWRFC_HOME/lib:$DYLD_LIBRARY_PATH
export PATH=$SAPNWRFC_HOME/bin:$PATH
```

## 启动应用

### 方式 1: 使用启动脚本（推荐）
```bash
cd /Users/chengzhang/Downloads/Github/node-rfc/web-app
./start-dev.sh
```

### 方式 2: 手动设置环境变量
```bash
cd /Users/chengzhang/Downloads/Github/node-rfc/web-app
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=$SAPNWRFC_HOME/lib:$DYLD_LIBRARY_PATH
npm run dev
```

### 方式 3: 新终端窗口（环境变量已永久配置）
```bash
# 关闭当前终端，打开新终端
cd /Users/chengzhang/Downloads/Github/node-rfc/web-app
npm run dev
```

## 验证安装

检查 node-rfc 是否正常：
```bash
node -e "const rfc = require('node-rfc'); console.log('✅ node-rfc 工作正常!')"
```

## 现在可以做什么？

✅ **真实 SAP 连接**：
- 连接到真实的 SAP 系统
- 测试连接会实际尝试连接 SAP
- RFC 调用会返回真实的 SAP 数据
- 不再显示 Mock 警告

## 常见问题

### "dyld: Library not loaded: @rpath/libsapnwrfc.dylib"
需要设置环境变量：
```bash
export DYLD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$DYLD_LIBRARY_PATH
```

### 新终端窗口找不到 SDK
重新加载配置：
```bash
source ~/.zshrc
```

### 权限问题
确保 SDK 目录可读：
```bash
sudo chmod -R 755 /usr/local/sap/nwrfcsdk
```

## 文件说明

- `lib/sap-client.ts` - 真实 SAP 客户端（已启用）
- `lib/sap-client-mock.ts` - Mock 客户端（备用）
- `start-dev.sh` - 启动脚本（自动设置环境变量）

## 切换回 Mock 模式

如果需要切换回 Mock 模式：
1. 编辑 `package.json`，移除 `"node-rfc": "file:../"`
2. 修改 API 文件，将 `@/lib/sap-client` 改为 `@/lib/sap-client-mock`
3. 运行 `npm install`

---

**安装时间**: 2025-12-16  
**SDK 版本**: SAP NW RFC SDK 7.50 PL18  
**状态**: ✅ 已安装并配置
