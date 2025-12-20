#!/bin/bash

# Railway 生产部署脚本

echo "🚀 准备部署到 Railway（生产模式 - 真实 SAP RFC）"

# 检查 nwrfcsdk 是否存在
if [ ! -d "nwrfcsdk" ]; then
    echo "❌ 错误: nwrfcsdk 文件夹不存在"
    echo "请确保 Linux 版本的 SAP NW RFC SDK 已解压到项目根目录"
    exit 1
fi

echo "✅ 找到 nwrfcsdk"

# 检查关键文件
if [ ! -f "nwrfcsdk/lib/libsapnwrfc.so" ]; then
    echo "❌ 错误: libsapnwrfc.so 不存在"
    exit 1
fi

echo "✅ SAP SDK 文件完整"

# 提示环境变量
echo ""
echo "📝 在 Railway 上需要设置以下环境变量："
echo ""
echo "必需:"
echo "  DATABASE_URL        - 由 Railway PostgreSQL 自动设置"
echo "  NEXTAUTH_SECRET     - 运行: openssl rand -base64 32"
echo "  NEXTAUTH_URL        - https://your-app.railway.app"
echo ""
echo "可选:"
echo "  NODE_ENV=production"
echo "  PORT=3000"
echo ""

# 提交代码
echo "是否现在提交并推送到 Git? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Configure Railway production deployment with SAP SDK"
    git push
    
    echo ""
    echo "✅ 代码已推送！"
    echo ""
    echo "下一步:"
    echo "1. 在 Railway 添加 PostgreSQL 数据库"
    echo "2. 设置上述环境变量"
    echo "3. 等待构建完成（可能需要 5-10 分钟）"
    echo "4. 使用 Railway Shell 创建管理员用户:"
    echo "   npx ts-node scripts/create-user.ts admin@example.com password123 'Admin'"
else
    echo ""
    echo "📦 请手动提交:"
    echo "  git add ."
    echo "  git commit -m 'Configure Railway production deployment'"
    echo "  git push"
fi
