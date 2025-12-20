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
ENV LD_LIBRARY_PATH=/usr/local/sap/nwrfcsdk/lib:$LD_LIBRARY_PATH
ENV NODE_ENV=production

# ============================================
# 构建 node-rfc
# ============================================
WORKDIR /build-rfc

# 复制 node-rfc 源码
COPY package*.json ./
COPY binding.gyp ./
COPY src ./src
COPY lib ./lib

# 安装并构建 node-rfc
RUN npm install --build-from-source

# ============================================
# 构建 web-app
# ============================================
WORKDIR /app

# 复制 web-app 依赖文件
COPY web-app/package*.json ./
COPY web-app/prisma ./prisma

# 安装 web-app 依赖（会通过 file:../ 链接到 node-rfc）
# 但我们需要手动复制构建好的 node-rfc
RUN mkdir -p /app/node_modules/node-rfc && \
    cp -r /build-rfc/node_modules/@sap /app/node_modules/ 2>/dev/null || true && \
    cp -r /build-rfc/build /app/node_modules/.node-rfc-build 2>/dev/null || true

# 安装依赖
RUN npm ci --only=production

# 手动链接 node-rfc
RUN rm -rf node_modules/node-rfc && \
    cp -r /build-rfc/. node_modules/node-rfc/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制 web-app 代码
COPY web-app/ .

# 构建 Next.js
RUN npm run build

EXPOSE 3000

# 启动命令：先运行迁移再启动应用
CMD npx prisma migrate deploy && npm start
