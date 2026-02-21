# Stage 1: Install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CloudBase 构建时环境变量：需在 CloudBase Run 构建设置中传入这些 ARG
# 否则 NEXT_PUBLIC_* 在构建阶段为 undefined，客户端会拿到空值
ARG NEXT_PUBLIC_CLOUDBASE_ENV
ARG NEXT_PUBLIC_CLOUDBASE_REGION
ARG NEXT_PUBLIC_CLOUDBASE_CLIENT_ID
ARG NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY

ENV NEXT_PUBLIC_CLOUDBASE_ENV=$NEXT_PUBLIC_CLOUDBASE_ENV
ENV NEXT_PUBLIC_CLOUDBASE_REGION=$NEXT_PUBLIC_CLOUDBASE_REGION
ENV NEXT_PUBLIC_CLOUDBASE_CLIENT_ID=$NEXT_PUBLIC_CLOUDBASE_CLIENT_ID
ENV NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY=$NEXT_PUBLIC_CLOUDBASE_ACCESS_KEY

# Use webpack build (Turbopack font modules fail in Docker; --webpack forces stable bundler)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:webpack

# Stage 3: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# CloudRun injects PORT; Next.js reads it
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
