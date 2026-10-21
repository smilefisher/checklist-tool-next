# 多阶段构建：安装依赖 → 编译 → 生产运行
# 说明：运行时依赖在镜像内用 pnpm 安装，避免从构建上下文拷贝
# pnpm 的 node_modules 符号链接目录（拷贝/打包过程容易把链接目标弄坏，
# 会导致 next 启动时报 Cannot find module '@swc/helpers/...'）。

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
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=4399

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 4399
CMD ["pnpm", "start"]
