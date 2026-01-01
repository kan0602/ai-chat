#!/bin/bash
# =============================================================================
# Secret Manager Setup Script for AI Chat
# =============================================================================
#
# このスクリプトは Secret Manager にシークレットを作成します。
#
# 使用方法:
# 1. 環境変数を設定（または実行時に入力）
# 2. ./scripts/setup-secrets.sh を実行
# =============================================================================

set -e

# =============================================================================
# 設定
# =============================================================================
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-northeast1}"

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
# シークレット作成関数
# =============================================================================
create_secret() {
    local secret_name=$1
    local secret_value=$2

    if gcloud secrets describe "$secret_name" &> /dev/null; then
        log_warn "シークレットは既に存在します: $secret_name"
        read -p "上書きしますか? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=-
            log_info "シークレットを更新しました: $secret_name"
        fi
    else
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --replication-policy="automatic"
        log_info "シークレットを作成しました: $secret_name"
    fi
}

# =============================================================================
# シークレット値の入力
# =============================================================================
prompt_secret() {
    local var_name=$1
    local prompt_text=$2
    local default_value=$3

    if [ -n "${!var_name}" ]; then
        echo "${!var_name}"
    else
        if [ -n "$default_value" ]; then
            read -p "$prompt_text [$default_value]: " value
            echo "${value:-$default_value}"
        else
            read -p "$prompt_text: " value
            echo "$value"
        fi
    fi
}

prompt_secret_hidden() {
    local var_name=$1
    local prompt_text=$2

    if [ -n "${!var_name}" ]; then
        echo "${!var_name}"
    else
        read -sp "$prompt_text: " value
        echo ""
        echo "$value"
    fi
}

# =============================================================================
# メイン処理
# =============================================================================
main() {
    echo "=============================================="
    echo "AI Chat - Secret Manager セットアップ"
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

    echo ""
    echo "シークレット値を入力してください:"
    echo "(環境変数で事前に設定することも可能です)"
    echo ""

    # DATABASE_URL
    log_info "MongoDB接続文字列"
    DATABASE_URL=$(prompt_secret "DATABASE_URL" "DATABASE_URL (mongodb+srv://...)")

    # NEXTAUTH_SECRET
    log_info "NextAuth.js シークレット"
    echo "生成コマンド: openssl rand -base64 32"
    NEXTAUTH_SECRET=$(prompt_secret_hidden "NEXTAUTH_SECRET" "NEXTAUTH_SECRET")

    # NEXTAUTH_URL
    log_info "NextAuth.js URL (デプロイ後に設定)"
    NEXTAUTH_URL=$(prompt_secret "NEXTAUTH_URL" "NEXTAUTH_URL" "https://ai-chat-xxxxx-an.a.run.app")

    # GOOGLE_CLIENT_ID
    log_info "Google OAuth Client ID"
    GOOGLE_CLIENT_ID=$(prompt_secret "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_ID")

    # GOOGLE_CLIENT_SECRET
    log_info "Google OAuth Client Secret"
    GOOGLE_CLIENT_SECRET=$(prompt_secret_hidden "GOOGLE_CLIENT_SECRET" "GOOGLE_CLIENT_SECRET")

    # ANTHROPIC_API_KEY
    log_info "Anthropic API Key"
    ANTHROPIC_API_KEY=$(prompt_secret_hidden "ANTHROPIC_API_KEY" "ANTHROPIC_API_KEY")

    echo ""
    echo "=============================================="
    echo "シークレットを作成しています..."
    echo "=============================================="
    echo ""

    create_secret "DATABASE_URL" "$DATABASE_URL"
    create_secret "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
    create_secret "NEXTAUTH_URL" "$NEXTAUTH_URL"
    create_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
    create_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
    create_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

    echo ""
    log_info "シークレットの設定が完了しました！"
    echo ""
    echo "作成されたシークレット:"
    gcloud secrets list --format="table(name)"
    echo ""
    echo "注意: デプロイ後にNEXTAUTH_URLを実際のCloud Run URLに更新してください"
}

main "$@"
