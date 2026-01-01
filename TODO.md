# AI Chat - 実行計画

## Phase 1: プロジェクト初期設定

- [x] Next.js プロジェクト作成（App Router）
- [x] 必要なパッケージのインストール
  - [x] Hono (`hono`, `@hono/node-server`)
  - [x] Prisma (`prisma`, `@prisma/client`)
  - [x] NextAuth.js (`next-auth`)
  - [x] Mastra (`@mastra/core`)
  - [x] Anthropic SDK (`@anthropic-ai/sdk`)
  - [x] UI関連（任意: `tailwindcss`, `shadcn/ui`）
- [x] TypeScript設定（strict mode）
- [x] ESLint + Prettier設定
- [x] 環境変数ファイル作成（`.env.example`, `.env.local`）
- [x] `.gitignore` 設定

## Phase 2: データベース設定

- [x] MongoDB Atlas でクラスター作成 ※ユーザー側で実施
- [x] 接続文字列を `.env.local` に設定 ※ユーザー側で実施
- [x] Prisma初期化 (`npx prisma init`)
- [x] `schema.prisma` 作成
  - [x] User モデル
  - [x] Chat モデル
  - [x] Message モデル
- [x] Prisma クライアント生成 (`npx prisma generate`)
- [x] Prisma クライアントのシングルトン設定 (`src/lib/prisma.ts`)

## Phase 3: 認証設定（NextAuth.js）

- [x] Google Cloud Console でOAuthクライアント作成 ※ユーザー側で実施
- [x] NextAuth.js 設定ファイル作成 (`src/lib/auth.ts`)
- [x] Google Provider 設定
- [x] Prisma Adapter 設定
- [x] API Route 作成 (`src/app/api/auth/[...nextauth]/route.ts`)
- [x] セッション取得用フック/ユーティリティ作成 (`src/lib/auth-utils.ts`)
- [x] 認証ミドルウェア作成（保護ルート用）(`src/middleware.ts`)

## Phase 4: バックエンドAPI設定（Hono）

- [x] Hono アプリケーション作成 (`src/server/api/index.ts`)
- [x] Next.js API Route との統合 (`src/app/api/[[...route]]/route.ts`)
- [x] 認証ミドルウェア作成（Hono用）(`src/server/api/middleware/auth.ts`)
- [x] Chat API 実装 (`src/server/api/chat.ts`)
  - [x] `GET /api/chat` - チャット一覧取得
  - [x] `POST /api/chat` - 新規チャット作成
  - [x] `GET /api/chat/:id` - チャット詳細取得
  - [x] `DELETE /api/chat/:id` - チャット削除
- [x] Message API 実装
  - [x] `POST /api/chat/:id/message` - メッセージ送信

## Phase 5: AIエージェント設定（Mastra）

- [x] Mastra 設定ファイル作成 (`src/lib/mastra/index.ts`)
- [x] Claude API 接続設定
- [x] エージェント定義（チャットボット用）(`src/lib/mastra/agents/chat-agent.ts`)
- [x] システムプロンプト設計
- [x] ストリーミングレスポンス対応 (`POST /api/chat/:id/message/stream`)
- [x] Message API との統合

## Phase 6: フロントエンド実装

- [x] 共通UIコンポーネント作成 (`src/components/ui/`)
  - [x] Button コンポーネント (`src/components/ui/button.tsx`)
  - [x] Input コンポーネント (`src/components/ui/input.tsx`)
  - [x] Card コンポーネント (`src/components/ui/card.tsx`)
  - [x] Avatar コンポーネント (`src/components/ui/avatar.tsx`)
- [x] レイアウトコンポーネント作成 (`src/components/layout/`)
  - [x] Header コンポーネント (`src/components/layout/header.tsx`)
  - [x] Sidebar コンポーネント (`src/components/layout/sidebar.tsx`)
- [x] チャットコンポーネント作成 (`src/components/chat/`)
  - [x] ChatMessage コンポーネント (`src/components/chat/chat-message.tsx`)
  - [x] ChatInput コンポーネント (`src/components/chat/chat-input.tsx`)
  - [x] ChatList コンポーネント (`src/components/chat/chat-list.tsx`)
  - [x] TypingIndicator コンポーネント (`src/components/chat/typing-indicator.tsx`)
- [x] ランディングページ実装 (`src/app/page.tsx`)
  - [x] サービス説明セクション
  - [x] ログインボタン（Google OAuth）
- [x] チャット一覧ページ実装 (`src/app/chat/page.tsx`)
  - [x] チャット履歴リスト表示
  - [x] 新規チャット作成ボタン
- [x] チャット画面実装 (`src/app/chat/[id]/page.tsx`)
  - [x] メッセージ一覧表示
  - [x] メッセージ入力・送信フォーム
  - [x] ストリーミングレスポンス表示
- [x] APIクライアント作成 (`src/lib/api-client.ts`)
  - [x] チャット一覧取得
  - [x] チャット作成・取得・削除
  - [x] メッセージ送信（通常・ストリーミング）
- [x] カスタムフック作成 (`src/hooks/`)
  - [x] useChat フック (`src/hooks/use-chat.ts`)
  - [x] useMessages フック (`src/hooks/use-messages.ts`)
  - [x] useStreamingMessage フック (`src/hooks/use-streaming-message.ts`)

## Phase 7: UI/UX改善

- [x] レスポンシブデザイン対応
  - [x] モバイル対応ヘッダー（ハンバーガーメニュー）
  - [x] レスポンシブサイドバー
  - [x] レスポンシブレイアウト（全ページ）
- [x] ダークモード対応
  - [x] useTheme フック (`src/hooks/use-theme.ts`)
  - [x] ThemeToggle コンポーネント (`src/components/ui/theme-toggle.tsx`)
  - [x] ヘッダーにダークモード切り替えボタン追加
- [x] ローディング状態の表示
  - [x] Skeleton コンポーネント (`src/components/ui/skeleton.tsx`)
  - [x] チャットリスト、サイドバー、カード用スケルトン
- [x] エラーハンドリング・表示
  - [x] ErrorMessage コンポーネント (`src/components/ui/error-message.tsx`)
  - [x] EmptyState コンポーネント
  - [x] 再試行ボタン付きエラー表示
- [x] トースト通知
  - [x] Toast コンポーネント (`src/components/ui/toast.tsx`)
  - [x] ToastProvider と useToast フック
  - [x] 成功・エラー・情報・警告タイプ対応
- [x] キーボードショートカット
  - [x] Enter で送信
  - [x] Shift + Enter で改行

## Phase 8: テスト

- [x] 単体テスト環境構築（Vitest）
  - [x] Vitest 設定 (`vitest.config.ts`)
  - [x] テストセットアップ (`src/test/setup.ts`)
  - [x] テストユーティリティ (`src/test/test-utils.tsx`)
  - [x] package.json にテストスクリプト追加
- [x] API エンドポイントテスト
  - [x] Chat API テスト (`src/server/api/__tests__/chat.test.ts`)
  - [x] CRUD操作テスト（一覧取得、作成、詳細取得、削除）
  - [x] メッセージ送信テスト
- [x] コンポーネントテスト
  - [x] Button テスト (`src/components/ui/__tests__/button.test.tsx`)
  - [x] Card テスト (`src/components/ui/__tests__/card.test.tsx`)
  - [x] ChatInput テスト (`src/components/chat/__tests__/chat-input.test.tsx`)
- [x] E2Eテスト環境構築（Playwright）
  - [x] Playwright 設定 (`playwright.config.ts`)
  - [x] ホームページテスト (`e2e/home.spec.ts`)
  - [x] レスポンシブテスト
  - [x] アクセシビリティテスト

## Phase 9: デプロイ準備

- [x] Dockerfile 作成
  - [x] マルチステージビルド（deps, builder, runner）
  - [x] node:20-alpine ベースイメージ
  - [x] Prismaクライアント対応
  - [x] 非rootユーザーで実行
- [x] `.dockerignore` 作成
- [x] `next.config.ts` に `output: 'standalone'` 設定（既存）
- [x] GitHub Actions ワークフロー作成 (`.github/workflows/deploy.yml`)
  - [x] テストジョブ（lint, unit tests）
  - [x] ビルド&デプロイジョブ（Cloud Run）
  - [x] Workload Identity Federation対応
- [x] Git 初期コミット作成
- [ ] GitHub リポジトリ作成・push ※ユーザー側で実施
  - 以下のコマンドでpush:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/ai-chat.git
  git push -u origin main
  ```

## Phase 10: Cloud Run デプロイ

- [x] デプロイスクリプト作成
  - [x] GCPセットアップスクリプト (`scripts/setup-gcp.sh`)
    - API有効化
    - Artifact Registry作成
    - サービスアカウント作成
    - Workload Identity Federation設定
  - [x] Secret Managerセットアップスクリプト (`scripts/setup-secrets.sh`)
    - DATABASE_URL
    - NEXTAUTH_SECRET
    - NEXTAUTH_URL
    - GOOGLE_CLIENT_ID
    - GOOGLE_CLIENT_SECRET
    - ANTHROPIC_API_KEY
  - [x] 手動デプロイスクリプト (`scripts/deploy.sh`)
- [x] デプロイガイド作成 (`docs/DEPLOYMENT.md`)
- [x] GitHub Actions ワークフロー作成（Phase 9で完了）
- [ ] 以下はユーザー側で実施 ※
  - [ ] Google Cloud プロジェクト作成
  - [ ] `./scripts/setup-gcp.sh` 実行
  - [ ] `./scripts/setup-secrets.sh` 実行
  - [ ] GitHub Secrets設定
  - [ ] `./scripts/deploy.sh` または GitHub push で初回デプロイ
  - [ ] NEXTAUTH_URL更新
  - [ ] Google OAuth許可リスト更新

## Phase 11: リリース後

- [ ] 本番環境での動作確認
- [ ] Google OAuth の本番URLを許可リストに追加
- [ ] モニタリング設定（Cloud Logging）
- [ ] エラー監視設定（任意: Sentry等）
- [ ] パフォーマンス監視

---

## 優先度・目安

| Phase | 重要度 | 依存関係 |
|-------|--------|----------|
| 1 | 必須 | なし |
| 2 | 必須 | Phase 1 |
| 3 | 必須 | Phase 2 |
| 4 | 必須 | Phase 2, 3 |
| 5 | 必須 | Phase 4 |
| 6 | 必須 | Phase 3, 4, 5 |
| 7 | 推奨 | Phase 6 |
| 8 | 推奨 | Phase 6 |
| 9 | 必須 | Phase 6 |
| 10 | 必須 | Phase 9 |
| 11 | 推奨 | Phase 10 |
