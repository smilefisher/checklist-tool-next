#!/bin/bash
set -e

IMAGE_NAME="checklist-tool"

cd "$(dirname "$0")"

# 确保当前用户有 docker 权限
if ! docker ps &>/dev/null; then
    if groups | grep -q docker; then
        DOCKER="docker"
    else
        DOCKER="sudo docker"
    fi
else
    DOCKER="docker"
fi

# 生成 Dockerfile
cat > /tmp/Dockerfile.checklist << 'DOCKERFILE'
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
EXPOSE 4399
ENV HOSTNAME=0.0.0.0
ENV PORT=4399
CMD ["pnpm", "start"]
DOCKERFILE

echo "==> 构建 Docker 镜像（多阶段构建：安装依赖 → 编译 → 打包运行）..."
$DOCKER build -f /tmp/Dockerfile.checklist -t ${IMAGE_NAME} .
rm -f /tmp/Dockerfile.checklist

echo "==> 导出镜像..."
rm -f checklist-tool.tar.gz
$DOCKER save ${IMAGE_NAME} | gzip > checklist-tool.tar.gz

echo ""
echo "✅ 构建完成: checklist-tool.tar.gz ($(du -h checklist-tool.tar.gz | cut -f1))"
echo "   运行 ./deploy.sh 上传并启动"
