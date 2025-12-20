# 生产环境 Dockerfile - 包含真实 SAP NW RFC SDK
FROM node:18-bullseye

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libuuid1 \
    libstdc++6 \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# 安装 SAP NW RFC SDK
# ============================================
COPY nwrfcsdk /usr/local/sap/nwrfcsdk

# 设置 SAP SDK 环境变量（必须在 npm install 之前设置）
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV NODE_ENV=production

# ============================================
# 构建 node-rfc（根目录项目）
# ============================================
WORKDIR /app

# 复制根目录项目文件
COPY package*.json ./
COPY binding.gyp ./
COPY tsconfig.json ./
COPY src ./src

# 安装依赖并构建 C++ 扩展
RUN npm install --verbose

# ============================================
# 构建 web-app
# ============================================
WORKDIR /app/web-app

# 复制 web-app 所有文件（.dockerignore 排除 node_modules）
COPY web-app/ ./

# 安装 web-app 依赖（包括 TypeScript）
RUN npm install

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js
RUN npm run build

# 清理 devDependencies
RUN npm prune --production

EXPOSE 3000

# 启动命令：先运行迁移再启动应用
CMD npx prisma migrate deploy && npm start
