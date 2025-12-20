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

# 设置 SAP SDK 环境变量
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV NODE_ENV=production

# ============================================
# 构建完整项目
# ============================================
WORKDIR /app

# 先复制根目录的 node-rfc 依赖
COPY package*.json ./
COPY binding.gyp ./
COPY src ./src
COPY lib ./lib

# 构建 node-rfc（强制从源码构建）
RUN npm install --build-from-source

# 复制 web-app
COPY web-app ./web-app

# 进入 web-app 目录
WORKDIR /app/web-app

# 安装 web-app 依赖
RUN npm ci --only=production

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js
RUN npm run build

EXPOSE 3000

# 启动命令：先运行迁移再启动应用
CMD npx prisma migrate deploy && npm start
