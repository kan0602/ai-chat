# AI Chat - Cloud Run デプロイガイド

このドキュメントでは、AI ChatアプリケーションをGoogle Cloud Runにデプロイする手順を説明します。

## 前提条件

- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) がインストール済み
- [Docker](https://docs.docker.com/get-docker/) がインストール済み
- GitHubアカウント
- Google Cloudアカウント（請求先アカウント設定済み）

## 1. Google Cloud プロジェクトの作成

### 1.1 プロジェクト作成

```bash
# 新規プロジェクト作成
gcloud projects create YOUR_PROJECT_ID --name="AI Chat"

# プロジェクトを選択
gcloud config set project YOUR_PROJECT_ID

# 請求先アカウントをリンク（GUIで実施推奨）
# https://console.cloud.google.com/billing
```

### 1.2 環境変数の設定

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-northeast1"
export GITHUB_REPO="your-username/ai-chat"
```

## 2. GCPリソースのセットアップ

セットアップスクリプトを使用して、必要なAPIとリソースを設定します。

```bash
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

このスクリプトは以下を実行します：
- 必要なAPIの有効化
- Artifact Registryリポジトリの作成
- サービスアカウントの作成と権限付与
- Workload Identity Federationの設定

## 3. Secret Managerの設定

シークレットを設定します。

```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

### 必要なシークレット

| シークレット名 | 説明 | 取得方法 |
|--------------|------|---------|
| DATABASE_URL | MongoDB接続文字列 | MongoDB Atlasから取得 |
| NEXTAUTH_SECRET | NextAuth.jsシークレット | `openssl rand -base64 32` |
| NEXTAUTH_URL | アプリケーションURL | デプロイ後に設定 |
| GOOGLE_CLIENT_ID | Google OAuth Client ID | Google Cloud Consoleから取得 |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret | Google Cloud Consoleから取得 |
| ANTHROPIC_API_KEY | Anthropic API Key | Anthropicダッシュボードから取得 |

## 4. GitHub Secretsの設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

| Secret名 | 値 |
|---------|-----|
| GCP_PROJECT_ID | あなたのGCPプロジェクトID |
| WIF_PROVIDER | `projects/PROJECT_ID/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| WIF_SERVICE_ACCOUNT | `github-actions@PROJECT_ID.iam.gserviceaccount.com` |

## 5. 初回デプロイ（手動）

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

デプロイ完了後、Cloud RunのURLが表示されます。

## 6. NEXTAUTH_URLの更新

デプロイ後のURLでNEXTAUTH_URLを更新します。

```bash
# Cloud Run URLを取得
SERVICE_URL=$(gcloud run services describe ai-chat --region asia-northeast1 --format="value(status.url)")

# シークレットを更新
echo -n "$SERVICE_URL" | gcloud secrets versions add NEXTAUTH_URL --data-file=-

# サービスを再デプロイ
gcloud run services update ai-chat --region asia-northeast1
```

## 7. Google OAuth設定の更新

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth 2.0 クライアントIDの設定を更新：

1. **承認済みのJavaScript生成元** に追加：
   - `https://ai-chat-xxxxx-an.a.run.app`

2. **承認済みのリダイレクトURI** に追加：
   - `https://ai-chat-xxxxx-an.a.run.app/api/auth/callback/google`

## 8. 自動デプロイの確認

GitHubにコードをpushすると、GitHub Actionsが自動的にデプロイを実行します。

```bash
git push origin main
```

GitHub Actionsのワークフローで以下が実行されます：
1. テスト（lint, unit tests）
2. Dockerイメージのビルド
3. Artifact Registryへのプッシュ
4. Cloud Runへのデプロイ

## トラブルシューティング

### デプロイが失敗する

```bash
# ログを確認
gcloud run services logs read ai-chat --region asia-northeast1

# イベントを確認
gcloud run services describe ai-chat --region asia-northeast1
```

### シークレットにアクセスできない

```bash
# サービスアカウントの権限を確認
gcloud projects get-iam-policy $GCP_PROJECT_ID \
  --filter="bindings.members:serviceAccount:*@run.googleapis.com"

# シークレットへのアクセス権を付与
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### OAuthエラー

1. Google Cloud ConsoleでリダイレクトURIが正しく設定されているか確認
2. NEXTAUTH_URLが正しいCloud Run URLに設定されているか確認
3. GOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETが正しいか確認

## リソースの削除

プロジェクトを削除する場合：

```bash
gcloud projects delete $GCP_PROJECT_ID
```

個別のリソースを削除する場合：

```bash
# Cloud Runサービス削除
gcloud run services delete ai-chat --region asia-northeast1

# Artifact Registryリポジトリ削除
gcloud artifacts repositories delete ai-chat --location asia-northeast1

# シークレット削除
gcloud secrets delete DATABASE_URL
gcloud secrets delete NEXTAUTH_SECRET
gcloud secrets delete NEXTAUTH_URL
gcloud secrets delete GOOGLE_CLIENT_ID
gcloud secrets delete GOOGLE_CLIENT_SECRET
gcloud secrets delete ANTHROPIC_API_KEY
```
