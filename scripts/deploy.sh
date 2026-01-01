#!/bin/bash
# =============================================================================
# Manual Deploy Script for AI Chat
# =============================================================================
#
# 初回デプロイや手動デプロイ時に使用します。
#
# 使用方法:
# 1. 環境変数を設定
# 2. ./scripts/deploy.sh を実行
# =============================================================================

set -e

# =============================================================================
# 設定
# =============================================================================
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="ai-chat"

# =============================================================================
# 色付き出力
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
# メイン処理
# =============================================================================
main() {
    echo "=============================================="
    echo "AI Chat - 手動デプロイスクリプト"
    echo "=============================================="
    echo ""

    # プロジェクトID確認
    if [ -z "$PROJECT_ID" ]; then
        read -p "GCP Project ID: " PROJECT_ID
    fi

    if [ -z "$PROJECT_ID" ]; then
        log_error "Project ID は必須です"
        exit 1
    fi

    gcloud config set project "$PROJECT_ID"

    # イメージ名
    IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME"
    TAG=$(date +%Y%m%d-%H%M%S)

    log_info "Dockerイメージをビルドしています..."
    docker build -t "$IMAGE_NAME:$TAG" -t "$IMAGE_NAME:latest" .

    log_info "Docker認証を設定しています..."
    gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

    log_info "イメージをプッシュしています..."
    docker push "$IMAGE_NAME:$TAG"
    docker push "$IMAGE_NAME:latest"

    log_info "Cloud Run にデプロイしています..."
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME:$TAG" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-secrets="DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,NEXTAUTH_URL=NEXTAUTH_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest"

    echo ""
    log_info "デプロイが完了しました！"
    echo ""

    # デプロイされたURLを取得
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --format="value(status.url)")

    echo "=============================================="
    echo "サービスURL: $SERVICE_URL"
    echo "=============================================="
    echo ""
    echo "次のステップ:"
    echo "1. 上記URLでアプリケーションにアクセス"
    echo "2. NEXTAUTH_URL を更新:"
    echo "   gcloud secrets versions add NEXTAUTH_URL --data-file=- <<< '$SERVICE_URL'"
    echo "3. Google OAuth の許可リストに $SERVICE_URL を追加"
    echo "4. サービスを再デプロイして NEXTAUTH_URL を反映"
}

main "$@"
