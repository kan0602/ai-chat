# AI Chat - エンターテイメントチャットボット

## プロジェクト概要

エンターテイメント向けAIチャットボットWebアプリケーション。
キャラクター設定が可能な汎用チャットボットとして、ユーザーに楽しい会話体験を提供する。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フロントエンド | Next.js 15 (App Router) |
| バックエンド | Hono |
| ORM | Prisma |
| データベース | MongoDB |
| AIモデル | Claude API (Anthropic) |
| AIエージェント | Mastra |
| 認証 | NextAuth.js (Google OAuth) |
| ソース管理 | GitHub |
| デプロイ | Google Cloud Run（GitHub連携で自動デプロイ） |

## 機能要件

### 必須機能（MVP）

- [ ] ユーザー認証（Google OAuth）
- [ ] AIとのチャット機能
- [ ] 会話履歴の保存・表示
- [ ] 新規チャットの作成
- [ ] チャット履歴の一覧表示

### 追加機能（将来）

- [ ] キャラクター設定（AIのペルソナ変更）
- [ ] チャットの削除
- [ ] チャットのエクスポート
- [ ] ダークモード対応

## アーキテクチャ

```
[ブラウザ] <--> [Next.js App Router]
                      |
                      v
               [Hono API Routes]
                      |
              +-------+-------+
              |               |
              v               v
         [Mastra]        [Prisma]
              |               |
              v               v
       [Claude API]     [MongoDB]
```

## ディレクトリ構造

```
ai-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # ランディングページ
│   │   ├── chat/
│   │   │   ├── page.tsx        # チャット一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 個別チャット画面
│   │   └── api/
│   │       └── [[...route]]/
│   │           └── route.ts    # Hono API エントリポイント
│   ├── components/
│   │   ├── ui/                 # 汎用UIコンポーネント
│   │   ├── chat/               # チャット関連コンポーネント
│   │   └── layout/             # レイアウトコンポーネント
│   ├── lib/
│   │   ├── prisma.ts           # Prismaクライアント
│   │   ├── auth.ts             # NextAuth設定
│   │   └── mastra/             # Mastra設定
│   │       └── index.ts
│   ├── server/
│   │   └── api/                # Hono APIルート定義
│   │       ├── index.ts
│   │       ├── chat.ts
│   │       └── message.ts
│   └── types/
│       └── index.ts            # 型定義
├── prisma/
│   └── schema.prisma           # Prismaスキーマ
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Cloud Run自動デプロイ
├── .env.local                  # 環境変数（gitignore）
├── .env.example                # 環境変数テンプレート
├── Dockerfile                  # Cloud Run用
├── .dockerignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## データモデル（Prisma Schema）

```prisma
model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  email         String    @unique
  name          String?
  image         String?
  chats         Chat[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Chat {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  title         String?
  userId        String    @db.ObjectId
  user          User      @relation(fields: [userId], references: [id])
  messages      Message[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Message {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  content       String
  role          String    // "user" | "assistant"
  chatId        String    @db.ObjectId
  chat          Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt     DateTime  @default(now())
}
```

## 環境変数

```bash
# .env.example

# Database
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Anthropic
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | /api/chat | チャット一覧取得 |
| POST | /api/chat | 新規チャット作成 |
| GET | /api/chat/:id | チャット詳細取得 |
| DELETE | /api/chat/:id | チャット削除 |
| POST | /api/chat/:id/message | メッセージ送信（AI応答含む） |

## 開発ガイドライン

### コーディング規約

- TypeScript strict mode を使用
- ESLint + Prettier でコード整形
- コンポーネントは関数コンポーネントで記述
- Server Components をデフォルトとし、必要な場合のみ Client Components を使用

### コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コード整形
refactor: リファクタリング
test: テスト追加・修正
chore: その他雑務
```

### ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `fix/*`: バグ修正

## セットアップ手順

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して各種キーを設定

# Prisma クライアント生成
npx prisma generate

# 開発サーバー起動
npm run dev
```

## デプロイ手順

### GitHub リポジトリ作成

```bash
# GitHubでリポジトリを作成後
git remote add origin https://github.com/<username>/ai-chat.git
git branch -M main
git push -u origin main
```

### Google Cloud プロジェクト設定

```bash
# gcloud CLI インストール後
gcloud auth login
gcloud config set project <PROJECT_ID>

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Secret Manager で環境変数を管理

```bash
# シークレット作成
echo -n "mongodb+srv://..." | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "your-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
echo -n "your-api-key" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
```

### Cloud Run へデプロイ（手動）

```bash
# ビルドしてデプロイ
gcloud run deploy ai-chat \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-env-vars="NEXTAUTH_URL=https://<SERVICE_URL>"
```

### GitHub Actions で自動デプロイ

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ai-chat
          region: asia-northeast1
          source: .
```

### Workload Identity Federation 設定

GitHub ActionsからCloud Runにデプロイするために必要：

```bash
# サービスアカウント作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# 権限付与
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:github-actions@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:github-actions@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Workload Identity Pool 作成
gcloud iam workload-identity-pools create "github" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Provider 作成
gcloud iam workload-identity-pools providers create-oidc "github" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

## Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 依存関係インストール
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 本番環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
```

## 参考リンク

- [Next.js App Router](https://nextjs.org/docs/app)
- [Hono](https://hono.dev/)
- [Prisma with MongoDB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Mastra](https://mastra.ai/docs)
- [Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [NextAuth.js](https://next-auth.js.org/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [GitHub Actions for Cloud Run](https://github.com/google-github-actions/deploy-cloudrun)
