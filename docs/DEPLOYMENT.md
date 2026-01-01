# AI Chat - Cloud Run デプロイガイド（初心者向け）

このドキュメントでは、AI ChatアプリケーションをGoogle Cloud Runにデプロイする手順を、GCP初心者の方でも分かるように詳しく説明します。

---

## 目次

1. [事前準備](#1-事前準備)
2. [Google Cloud プロジェクトの作成](#2-google-cloud-プロジェクトの作成)
3. [Google Cloud SDK のインストール](#3-google-cloud-sdk-のインストール)
4. [MongoDB Atlas の設定](#4-mongodb-atlas-の設定)
5. [Google OAuth の設定](#5-google-oauth-の設定)
6. [Anthropic API Key の取得](#6-anthropic-api-key-の取得)
7. [GCP リソースのセットアップ](#7-gcp-リソースのセットアップ)
8. [Secret Manager の設定](#8-secret-manager-の設定)
9. [GitHub リポジトリの設定](#9-github-リポジトリの設定)
10. [初回デプロイ](#10-初回デプロイ)
11. [デプロイ後の設定](#11-デプロイ後の設定)
12. [動作確認](#12-動作確認)
13. [トラブルシューティング](#13-トラブルシューティング)

---

## 1. 事前準備

### 必要なアカウント

以下のアカウントを事前に作成してください：

| サービス | 用途 | 作成URL |
|---------|------|---------|
| Google Cloud | アプリのホスティング | https://cloud.google.com/ |
| GitHub | ソースコード管理 | https://github.com/ |
| MongoDB Atlas | データベース | https://www.mongodb.com/atlas |
| Anthropic | AI API | https://console.anthropic.com/ |

### 必要なソフトウェア

| ソフトウェア | 用途 | インストール方法 |
|-------------|------|-----------------|
| Git | バージョン管理 | https://git-scm.com/downloads |
| Docker Desktop | コンテナ実行 | https://www.docker.com/products/docker-desktop/ |
| Google Cloud SDK | GCP操作 | 次のセクションで説明 |

---

## 2. Google Cloud プロジェクトの作成

### 2.1 Google Cloud Console にアクセス

1. ブラウザで https://console.cloud.google.com/ を開く
2. Googleアカウントでログイン

### 2.2 新規プロジェクトの作成

1. 画面上部のプロジェクト選択ドロップダウンをクリック

   ![プロジェクト選択](https://cloud.google.com/static/docs/images/project-selector.png)

2. 「新しいプロジェクト」をクリック

3. プロジェクト情報を入力：
   - **プロジェクト名**: `ai-chat`（任意の名前）
   - **プロジェクトID**: 自動生成されます（メモしておく）
   - **請求先アカウント**: 選択（なければ作成）
   - **場所**: 組織を選択（個人の場合は「組織なし」）

4. 「作成」をクリック

### 2.3 請求先アカウントの設定

> ⚠️ **重要**: Cloud Runは無料枠がありますが、請求先アカウントの設定は必須です。

1. 左側メニューから「お支払い」を選択
2. 「請求先アカウントをリンク」をクリック
3. 既存のアカウントを選択、またはクレジットカードを登録して新規作成

### 2.4 プロジェクトIDをメモ

プロジェクトIDは後で何度も使用します。以下の場所で確認できます：
- プロジェクト選択ドロップダウン
- 「プロジェクト情報」カード

```
例: ai-chat-123456
```

---

## 3. Google Cloud SDK のインストール

### Windows の場合

1. https://cloud.google.com/sdk/docs/install#windows にアクセス

2. 「Google Cloud CLI インストーラ」をダウンロード

3. ダウンロードした `GoogleCloudSDKInstaller.exe` を実行

4. インストールウィザードに従ってインストール
   - すべてデフォルト設定でOK
   - 「Run 'gcloud init'」にチェックを入れる

5. インストール完了後、自動的にターミナルが開く

### Mac の場合

1. ターミナルを開く

2. 以下のコマンドを実行：
   ```bash
   # Homebrewがインストールされている場合
   brew install --cask google-cloud-sdk

   # または公式インストーラを使用
   curl https://sdk.cloud.google.com | bash
   ```

3. ターミナルを再起動

### gcloud の初期設定

1. ターミナル（コマンドプロンプト/PowerShell）を開く

2. 初期化コマンドを実行：
   ```bash
   gcloud init
   ```

3. ブラウザが開くのでGoogleアカウントでログイン

4. プロジェクトを選択：
   ```
   Pick cloud project to use:
    [1] ai-chat-123456
    [2] Create a new project
   Please enter numeric choice or text value: 1
   ```

5. デフォルトリージョンを設定：
   ```
   Do you want to configure a default Compute Region and Zone? (Y/n)? Y
   ```
   `asia-northeast1` (東京) を選択

### インストールの確認

```bash
gcloud --version
```

以下のような出力が表示されればOK：
```
Google Cloud SDK 450.0.0
...
```

---

## 4. MongoDB Atlas の設定

### 4.1 アカウント作成とクラスター作成

1. https://www.mongodb.com/atlas にアクセス

2. 「Try Free」をクリックしてアカウント作成

3. 組織とプロジェクトを作成（デフォルトでOK）

4. クラスター作成画面で：
   - **プラン**: M0 Sandbox（無料）を選択
   - **プロバイダー**: Google Cloud を選択
   - **リージョン**: Tokyo (asia-northeast1) を選択
   - **クラスター名**: `ai-chat-cluster`

5. 「Create」をクリック（作成に1-3分かかります）

### 4.2 データベースユーザーの作成

1. 左メニューの「Database Access」をクリック

2. 「Add New Database User」をクリック

3. ユーザー情報を入力：
   - **Authentication Method**: Password
   - **Username**: `ai-chat-user`（任意）
   - **Password**: 「Autogenerate Secure Password」をクリック
     - ⚠️ **パスワードを必ずメモしておく**
   - **Database User Privileges**: Read and write to any database

4. 「Add User」をクリック

### 4.3 ネットワークアクセスの設定

1. 左メニューの「Network Access」をクリック

2. 「Add IP Address」をクリック

3. 「Allow Access from Anywhere」をクリック
   - これにより `0.0.0.0/0` が追加されます
   - ⚠️ 本番環境ではCloud RunのIPに制限することを推奨

4. 「Confirm」をクリック

### 4.4 接続文字列の取得

1. 左メニューの「Database」をクリック

2. クラスターの「Connect」ボタンをクリック

3. 「Connect your application」を選択

4. 接続文字列をコピー：
   ```
   mongodb+srv://ai-chat-user:<password>@ai-chat-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. `<password>` を実際のパスワードに置き換え：
   ```
   mongodb+srv://ai-chat-user:実際のパスワード@ai-chat-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **この接続文字列を安全な場所にメモ**（後で `DATABASE_URL` として使用）

---

## 5. Google OAuth の設定

### 5.1 OAuth 同意画面の設定

1. Google Cloud Console で左メニューから「APIとサービス」→「OAuth 同意画面」を選択

2. User Typeを選択：
   - **外部**: 一般公開する場合
   - **内部**: 組織内のみの場合（Google Workspaceが必要）

   今回は「外部」を選択して「作成」

3. アプリ情報を入力：
   - **アプリ名**: `AI Chat`
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス

4. 「保存して次へ」をクリック

5. スコープ画面: 何も追加せず「保存して次へ」

6. テストユーザー画面:
   - 「ADD USERS」をクリック
   - テストに使うGoogleアカウントのメールを追加
   - 「保存して次へ」

7. 概要を確認して「ダッシュボードに戻る」

### 5.2 OAuth クライアントIDの作成

1. 左メニューから「認証情報」を選択

2. 「認証情報を作成」→「OAuth クライアント ID」をクリック

3. 設定を入力：
   - **アプリケーションの種類**: ウェブアプリケーション
   - **名前**: `AI Chat Web Client`

4. **承認済みの JavaScript 生成元**:
   - 「URIを追加」をクリック
   - `http://localhost:3000` を追加（開発用）

5. **承認済みのリダイレクト URI**:
   - 「URIを追加」をクリック
   - `http://localhost:3000/api/auth/callback/google` を追加（開発用）

6. 「作成」をクリック

7. 表示されるダイアログから以下をメモ：
   - **クライアントID**: `xxxx.apps.googleusercontent.com`
   - **クライアントシークレット**: `GOCSPX-xxxx`

> 📝 **メモ**: 本番URL（Cloud RunのURL）は後で追加します

---

## 6. Anthropic API Key の取得

1. https://console.anthropic.com/ にアクセス

2. アカウントを作成またはログイン

3. 左メニューから「API Keys」を選択

4. 「Create Key」をクリック

5. キー名を入力（例: `ai-chat-production`）

6. 「Create Key」をクリック

7. 表示されるAPIキーをコピーして安全な場所にメモ
   ```
   sk-ant-api03-xxxxxxxxxxxx
   ```

> ⚠️ **注意**: APIキーは一度しか表示されません。必ずメモしてください。

---

## 7. GCP リソースのセットアップ

### 7.1 環境変数の設定

ターミナルを開き、以下のコマンドを実行：

**Windows (PowerShell)**:
```powershell
$env:GCP_PROJECT_ID = "あなたのプロジェクトID"
$env:GCP_REGION = "asia-northeast1"
$env:GITHUB_REPO = "あなたのGitHubユーザー名/ai-chat"
```

**Mac/Linux**:
```bash
export GCP_PROJECT_ID="あなたのプロジェクトID"
export GCP_REGION="asia-northeast1"
export GITHUB_REPO="あなたのGitHubユーザー名/ai-chat"
```

### 7.2 セットアップスクリプトの実行

プロジェクトディレクトリに移動して、セットアップスクリプトを実行：

**Mac/Linux**:
```bash
cd ai-chat
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

**Windows (Git Bash を使用)**:
```bash
cd ai-chat
bash scripts/setup-gcp.sh
```

### 7.3 スクリプトが行うこと

スクリプトは以下を自動的に設定します：

1. **API の有効化**:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API
   - IAM API

2. **Artifact Registry リポジトリ作成**:
   - Dockerイメージを保存する場所

3. **サービスアカウント作成**:
   - GitHub ActionsがGCPにアクセスするためのアカウント

4. **Workload Identity Federation 設定**:
   - GitHub ActionsがGCPに安全に認証するための仕組み

### 7.4 出力される値をメモ

スクリプト完了時に表示される値をメモ：

```
==============================================
GitHub Secrets に以下を設定してください:
==============================================

GCP_PROJECT_ID: ai-chat-123456
WIF_PROVIDER: projects/ai-chat-123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT: github-actions@ai-chat-123456.iam.gserviceaccount.com
```

---

## 8. Secret Manager の設定

### 8.1 セットアップスクリプトの実行

**Mac/Linux**:
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

**Windows (Git Bash)**:
```bash
bash scripts/setup-secrets.sh
```

### 8.2 シークレット値の入力

スクリプトが各シークレットの値を聞いてきます：

```
シークレット値を入力してください:

[INFO] MongoDB接続文字列
DATABASE_URL (mongodb+srv://...):
→ MongoDB Atlasの接続文字列を入力

[INFO] NextAuth.js シークレット
NEXTAUTH_SECRET:
→ 以下のコマンドで生成した値を入力
   openssl rand -base64 32

[INFO] NextAuth.js URL (デプロイ後に設定)
NEXTAUTH_URL [https://ai-chat-xxxxx-an.a.run.app]:
→ Enterを押してデフォルト値を使用（後で更新）

[INFO] Google OAuth Client ID
GOOGLE_CLIENT_ID:
→ Google Cloud Consoleで取得したClient IDを入力

[INFO] Google OAuth Client Secret
GOOGLE_CLIENT_SECRET:
→ Google Cloud Consoleで取得したClient Secretを入力

[INFO] Anthropic API Key
ANTHROPIC_API_KEY:
→ Anthropic Consoleで取得したAPI Keyを入力
```

### 8.3 NextAuth Secret の生成方法

**Mac/Linux**:
```bash
openssl rand -base64 32
```

**Windows (PowerShell)**:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

出力例: `K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=`

---

## 9. GitHub リポジトリの設定

### 9.1 リポジトリの作成

1. https://github.com/new にアクセス

2. リポジトリ情報を入力：
   - **Repository name**: `ai-chat`
   - **Description**: AI Chat application（任意）
   - **Public/Private**: お好みで選択
   - **Initialize this repository**: チェックしない

3. 「Create repository」をクリック

### 9.2 ローカルリポジトリをプッシュ

```bash
cd ai-chat
git remote add origin https://github.com/あなたのユーザー名/ai-chat.git
git push -u origin main
```

### 9.3 GitHub Secrets の設定

1. GitHubリポジトリページで「Settings」タブをクリック

2. 左メニューから「Secrets and variables」→「Actions」を選択

3. 「New repository secret」をクリックして、以下を追加：

| Name | Value |
|------|-------|
| `GCP_PROJECT_ID` | あなたのGCPプロジェクトID |
| `WIF_PROVIDER` | `projects/PROJECT_ID/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@PROJECT_ID.iam.gserviceaccount.com` |

> 📝 `PROJECT_ID` は実際のプロジェクトIDに置き換えてください

---

## 10. 初回デプロイ

### 10.1 手動デプロイの実行

初回は手動でデプロイして、Cloud RunのURLを取得します：

**Mac/Linux**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows (Git Bash)**:
```bash
bash scripts/deploy.sh
```

### 10.2 デプロイの進行状況

```
[INFO] Dockerイメージをビルドしています...
[INFO] Docker認証を設定しています...
[INFO] イメージをプッシュしています...
[INFO] Cloud Run にデプロイしています...
```

### 10.3 デプロイ完了

```
==============================================
サービスURL: https://ai-chat-xxxxx-an.a.run.app
==============================================
```

> 📝 このURLをメモしてください！

---

## 11. デプロイ後の設定

### 11.1 NEXTAUTH_URL の更新

1. Cloud Run URLを環境変数に設定：

   **Mac/Linux**:
   ```bash
   export SERVICE_URL="https://ai-chat-xxxxx-an.a.run.app"
   ```

   **Windows (PowerShell)**:
   ```powershell
   $env:SERVICE_URL = "https://ai-chat-xxxxx-an.a.run.app"
   ```

2. Secret Managerを更新：

   ```bash
   echo -n "$SERVICE_URL" | gcloud secrets versions add NEXTAUTH_URL --data-file=-
   ```

3. Cloud Runサービスを更新：

   ```bash
   gcloud run services update ai-chat --region asia-northeast1
   ```

### 11.2 Google OAuth の許可リスト更新

1. Google Cloud Console で「APIとサービス」→「認証情報」を開く

2. 作成したOAuth 2.0 クライアントIDをクリック

3. **承認済みの JavaScript 生成元** に追加：
   ```
   https://ai-chat-xxxxx-an.a.run.app
   ```

4. **承認済みのリダイレクト URI** に追加：
   ```
   https://ai-chat-xxxxx-an.a.run.app/api/auth/callback/google
   ```

5. 「保存」をクリック

---

## 12. 動作確認

### 12.1 アプリケーションにアクセス

1. ブラウザで Cloud Run URL を開く：
   ```
   https://ai-chat-xxxxx-an.a.run.app
   ```

2. ランディングページが表示されることを確認

### 12.2 ログインテスト

1. 「Googleでログイン」ボタンをクリック

2. Googleアカウントでログイン

3. チャット画面にリダイレクトされることを確認

### 12.3 チャット機能テスト

1. 「新しいチャット」をクリック

2. メッセージを入力して送信

3. AIからの応答が表示されることを確認

---

## 13. トラブルシューティング

### 「Error: unauthorized」が表示される

**原因**: Workload Identity Federationの設定が正しくない

**解決方法**:
```bash
# サービスアカウントの権限を確認
gcloud projects get-iam-policy $GCP_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@"
```

### 「Error: secret not found」が表示される

**原因**: Secret Managerにシークレットが設定されていない

**解決方法**:
```bash
# シークレット一覧を確認
gcloud secrets list

# シークレットを再作成
./scripts/setup-secrets.sh
```

### Google ログインで「Error 400: redirect_uri_mismatch」

**原因**: OAuth許可リストにCloud Run URLが追加されていない

**解決方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0 クライアントIDを編集
3. 正しいCloud Run URLを追加

### ページが真っ白になる

**原因**: サーバーエラーが発生している

**解決方法**:
```bash
# ログを確認
gcloud run services logs read ai-chat --region asia-northeast1 --limit 50
```

### データベース接続エラー

**原因**: MongoDB AtlasのIPアクセス制限

**解決方法**:
1. MongoDB Atlas → Network Access
2. 「Allow Access from Anywhere」(0.0.0.0/0) が設定されているか確認

---

## 自動デプロイについて

初回デプロイ完了後は、GitHubにコードをプッシュするだけで自動的にデプロイされます：

```bash
# コードを変更後
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actionsが自動的に：
1. テストを実行
2. Dockerイメージをビルド
3. Cloud Runにデプロイ

進捗は GitHub リポジトリの「Actions」タブで確認できます。

---

## リソースの削除（課金を止める場合）

プロジェクト全体を削除する場合：

```bash
gcloud projects delete $GCP_PROJECT_ID
```

> ⚠️ この操作は元に戻せません。すべてのデータが削除されます。

---

## 費用について

### 無料枠

- **Cloud Run**: 毎月200万リクエストまで無料
- **Artifact Registry**: 0.5GBまで無料
- **Secret Manager**: 10,000アクセスまで無料

### 有料になる可能性があるもの

- **MongoDB Atlas**: M0 (無料) を超える使用
- **Anthropic API**: 使用量に応じて課金

### 費用を抑えるコツ

1. Cloud Run の最小インスタンス数を0に設定（デフォルト）
2. 使用しないときはサービスを停止
3. MongoDB Atlas は M0 (無料) プランを使用
