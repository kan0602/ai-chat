#!/bin/bash
# =============================================================================
# Google Cloud Platform Setup Script for AI Chat
# =============================================================================
#
# このスクリプトは以下を設定します:
# 1. 必要なAPIの有効化
# 2. Artifact Registry リポジトリ作成
# 3. サービスアカウント作成
# 4. Workload Identity Federation 設定
#
# 使用方法:
# 1. 環境変数を設定
# 2. ./scripts/setup-gcp.sh を実行
# =============================================================================

set -e

# =============================================================================
# 設定（必要に応じて変更してください）
# =============================================================================
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="ai-chat"
GITHUB_REPO="${GITHUB_REPO:-your-username/ai-chat}"

# =============================================================================
# 色付き出力
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 前提条件チェック
# =============================================================================
check_prerequisites() {
    log_info "前提条件をチェックしています..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI がインストールされていません"
        exit 1
    fi

    if [ "$PROJECT_ID" == "your-project-id" ]; then
        log_error "GCP_PROJECT_ID 環境変数を設定してください"
        echo "例: export GCP_PROJECT_ID=my-project-123"
        exit 1
    fi

    if [ "$GITHUB_REPO" == "your-username/ai-chat" ]; then
        log_error "GITHUB_REPO 環境変数を設定してください"
        echo "例: export GITHUB_REPO=myusername/ai-chat"
        exit 1
    fi

    log_info "前提条件OK"
}

# =============================================================================
# プロジェクト設定
# =============================================================================
setup_project() {
    log_info "プロジェクトを設定しています: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
}

# =============================================================================
# APIの有効化
# =============================================================================
enable_apis() {
    log_info "必要なAPIを有効化しています..."

    apis=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "artifactregistry.googleapis.com"
        "secretmanager.googleapis.com"
        "iam.googleapis.com"
        "iamcredentials.googleapis.com"
    )

    for api in "${apis[@]}"; do
        log_info "  - $api を有効化中..."
        gcloud services enable "$api" --quiet
    done

    log_info "APIの有効化が完了しました"
}

# =============================================================================
# Artifact Registry リポジトリ作成
# =============================================================================
create_artifact_registry() {
    log_info "Artifact Registry リポジトリを作成しています..."

    if gcloud artifacts repositories describe "$SERVICE_NAME" \
        --location="$REGION" &> /dev/null; then
        log_warn "リポジトリは既に存在します: $SERVICE_NAME"
    else
        gcloud artifacts repositories create "$SERVICE_NAME" \
            --repository-format=docker \
            --location="$REGION" \
            --description="Docker repository for $SERVICE_NAME"
        log_info "リポジトリを作成しました: $SERVICE_NAME"
    fi
}

# =============================================================================
# サービスアカウント作成
# =============================================================================
create_service_account() {
    log_info "サービスアカウントを作成しています..."

    SA_NAME="github-actions"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

    if gcloud iam service-accounts describe "$SA_EMAIL" &> /dev/null; then
        log_warn "サービスアカウントは既に存在します: $SA_EMAIL"
    else
        gcloud iam service-accounts create "$SA_NAME" \
            --display-name="GitHub Actions Service Account"
        log_info "サービスアカウントを作成しました: $SA_EMAIL"
    fi

    # 必要な権限を付与
    log_info "権限を付与しています..."

    roles=(
        "roles/run.admin"
        "roles/storage.admin"
        "roles/artifactregistry.writer"
        "roles/secretmanager.secretAccessor"
        "roles/iam.serviceAccountUser"
    )

    for role in "${roles[@]}"; do
        log_info "  - $role を付与中..."
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="$role" \
            --quiet
    done

    echo "$SA_EMAIL"
}

# =============================================================================
# Workload Identity Federation 設定
# =============================================================================
setup_workload_identity() {
    log_info "Workload Identity Federation を設定しています..."

    SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
    POOL_NAME="github-pool"
    PROVIDER_NAME="github-provider"

    # Workload Identity Pool 作成
    if gcloud iam workload-identity-pools describe "$POOL_NAME" \
        --location="global" &> /dev/null; then
        log_warn "Workload Identity Pool は既に存在します: $POOL_NAME"
    else
        gcloud iam workload-identity-pools create "$POOL_NAME" \
            --location="global" \
            --display-name="GitHub Actions Pool"
        log_info "Workload Identity Pool を作成しました: $POOL_NAME"
    fi

    # Workload Identity Provider 作成
    if gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
        --workload-identity-pool="$POOL_NAME" \
        --location="global" &> /dev/null; then
        log_warn "Workload Identity Provider は既に存在します: $PROVIDER_NAME"
    else
        gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
            --location="global" \
            --workload-identity-pool="$POOL_NAME" \
            --display-name="GitHub Provider" \
            --issuer-uri="https://token.actions.githubusercontent.com" \
            --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
            --attribute-condition="assertion.repository=='$GITHUB_REPO'"
        log_info "Workload Identity Provider を作成しました: $PROVIDER_NAME"
    fi

    # サービスアカウントにバインディング
    log_info "サービスアカウントをバインドしています..."

    WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
        --location="global" \
        --format="value(name)")

    gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
        --role="roles/iam.workloadIdentityUser" \
        --member="principalSet://iam.googleapis.com/$WORKLOAD_IDENTITY_POOL_ID/attribute.repository/$GITHUB_REPO" \
        --quiet

    # GitHub Secretsに設定する値を出力
    WIF_PROVIDER="projects/$PROJECT_ID/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"

    echo ""
    echo "=============================================="
    echo "GitHub Secrets に以下を設定してください:"
    echo "=============================================="
    echo ""
    echo "GCP_PROJECT_ID: $PROJECT_ID"
    echo "WIF_PROVIDER: $WIF_PROVIDER"
    echo "WIF_SERVICE_ACCOUNT: $SA_EMAIL"
    echo ""
}

# =============================================================================
# メイン処理
# =============================================================================
main() {
    echo "=============================================="
    echo "AI Chat - GCP セットアップスクリプト"
    echo "=============================================="
    echo ""

    check_prerequisites
    setup_project
    enable_apis
    create_artifact_registry
    create_service_account
    setup_workload_identity

    echo ""
    log_info "セットアップが完了しました！"
    echo ""
    echo "次のステップ:"
    echo "1. 上記の値をGitHub Secretsに設定"
    echo "2. ./scripts/setup-secrets.sh を実行してSecret Managerを設定"
    echo "3. GitHubにpushして自動デプロイを確認"
}

main "$@"
