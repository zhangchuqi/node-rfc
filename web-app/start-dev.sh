#!/bin/bash

# 设置 SAP NW RFC SDK 环境变量
export SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
export DYLD_LIBRARY_PATH=$SAPNWRFC_HOME/lib:$DYLD_LIBRARY_PATH
export PATH=$SAPNWRFC_HOME/bin:$PATH

# 启动 Next.js 开发服务器
echo "🚀 Starting SAP RFC Web Manager with real SAP connection..."
echo "📍 SAP NW RFC SDK: $SAPNWRFC_HOME"
echo ""

npm run dev
