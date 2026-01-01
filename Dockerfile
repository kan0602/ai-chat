# ベースイメージ
FROM node:20-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# パッケージファイルをコピー
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 依存関係をインストール
RUN npm ci

# Prismaクライアントを生成
RUN npx prisma generate

# ビルドステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数を設定（ビルド時に必要な場合）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# アプリケーションをビルド
RUN npm run build

# 本番ステージ
FROM base AS runner
WORKDIR /app

# セキュリティのため非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 環境変数を設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# 必要なファイルをコピー
COPY --from=builder /app/public ./public

# standaloneモードの出力をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prismaクライアントをコピー
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# ユーザーを切り替え
USER nextjs

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
CMD ["node", "server.js"]
