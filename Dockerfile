FROM node:22.16.0-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

RUN apk add --no-cache curl

FROM base AS development

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["pnpm", "run", "start:dev"]

FROM base AS production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY . .

RUN pnpm run build

# 非rootユーザーの作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["pnpm", "run", "start:prod"]
