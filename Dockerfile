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
# 先检查构建上下文
RUN echo "Checking build context..." && pwd && ls -la

# 复制 SDK
COPY nwrfcsdk /usr/local/sap/nwrfcsdk

# 验证 SDK 文件已复制
RUN echo "Checking SAP SDK files..." && \
    ls -la /usr/local/sap/nwrfcsdk/lib/ && \
    file /usr/local/sap/nwrfcsdk/lib/libsapnwrfc.so

# 设置 SAP SDK 环境变量（必须在 npm install 之前设置）
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib
ENV NODE_ENV=production

# ============================================
# 构建完整项目
# ============================================
WORKDIR /app

# 先复制根目录的 node-rfc 项目文件
COPY package*.json ./
COPY binding.gyp ./
COPY tsconfig.json* ./
COPY src ./src

# 安装依赖（会触发 C++ 编译）
# 使用 verbose 模式查看详细信息
RUN echo "SAPNWRFC_HOME=$SAPNWRFC_HOME" && \
    echo "LIBRARY_PATH=$LIBRARY_PATH" && \
    npm install --verbose 2>&1 | tail -100

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
