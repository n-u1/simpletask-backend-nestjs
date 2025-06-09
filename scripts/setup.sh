#!/bin/bash

# SimpleTask Nest.js Backend セットアップスクリプト

set -e

echo "🚀 SimpleTask Nest.js Backend セットアップを開始します..."

# 関数定義
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ エラー: $1 がインストールされていません"
        echo "💡 インストール方法:"
        case "$1" in
            "node")
                echo "   https://nodejs.org/en/download/"
                echo "   または volta を使用: volta install node@22"
                ;;
            "volta")
                echo "   curl https://get.volta.sh | bash"
                echo "   その後、新しいターミナルを開いてください"
                ;;
            "pnpm")
                echo "   volta install pnpm"
                echo "   または npm install -g pnpm"
                ;;
            "docker")
                echo "   https://docs.docker.com/get-docker/"
                ;;
            "docker-compose")
                echo "   https://docs.docker.com/compose/install/"
                ;;
            "git")
                echo "   sudo apt-get install git (Ubuntu/Debian)"
                echo "   brew install git (macOS)"
                ;;
        esac
        exit 1
    fi
}

# 必要なコマンドの存在確認
echo "🔍 必要なツールの確認..."
check_command "volta"
check_command "node"
check_command "pnpm"
check_command "docker"
check_command "docker-compose"
check_command "git"

# Node.js バージョンチェック
NODE_VERSION=$(node --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
REQUIRED_MAJOR_VERSION="22"

if [[ ! "$NODE_VERSION" =~ ^22\. ]]; then
    echo "❌ エラー: Node.js 22.x が必要です（現在: v$NODE_VERSION）"
    echo "💡 解決方法:"
    echo "1. volta install node@22.x"
    echo "2. volta pin node@22.x"
    echo ""
    echo "📝 例: v22.0.0, v22.1.0, v22.15.0 などは全て使用可能"

    # 自動修正を提案
    read -p "🤔 Volta で Node.js 22.x を自動インストールしますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Node.js 22.x をインストール中..."
        volta install node@22.x
        volta pin node@22.x
        echo "✅ Node.js 22.x インストール完了"
        NODE_VERSION=$(node --version | cut -d'v' -f2)
    else
        exit 1
    fi
fi

# pnpm バージョンチェック & 自動設定
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm をインストール中..."
    volta install pnpm
fi

PNPM_VERSION=$(pnpm --version)
echo "✅ Node.js バージョン確認: v$NODE_VERSION (Volta管理)"
echo "✅ pnpm バージョン確認: $PNPM_VERSION (Volta管理)"

# Volta プロジェクト設定確認
if [ ! -f "package.json" ]; then
    echo "📝 package.json が見つからないため、Volta設定をスキップします"
else
    echo "🔧 Volta プロジェクト設定を確認中..."

    # package.jsonに volta 設定を追加
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.volta = pkg.volta || {};
        pkg.volta.node = '$NODE_VERSION';
        pkg.volta.pnpm = '$PNPM_VERSION';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ package.json に Volta 設定を追加しました');
    "
fi

# OS 検出（sedコマンドの引数調整用）
OS="$(uname -s)"

# 1. .env ファイル作成
if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        echo "❌ エラー: .env.example ファイルが見つかりません"
        echo "💡 プロジェクトルートで実行していることを確認してください"
        exit 1
    fi

    echo "📝 .env ファイルを作成しています..."
    cp .env.example .env

    # 開発環境用の安全な初期値を設定
    echo "🔑 開発環境用のランダム値を生成しています..."

    # ランダムなJWT秘密鍵を生成（開発用）
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")

    # ランダムなパスワードを生成（開発用）
    DB_PASSWORD=$(node -e "console.log('dev_db_' + require('crypto').randomBytes(16).toString('base64url'))")
    REDIS_PASSWORD=$(node -e "console.log('dev_redis_' + require('crypto').randomBytes(16).toString('base64url'))")

    # プレースホルダーを実際の値に置換（OS別対応）
    if [[ "$OS" == "Darwin" ]]; then
        sed -i '' "s/CHANGE_ME_GENERATE_RANDOM_SECRET_KEY_MINIMUM_32_CHARS/${JWT_SECRET}/" .env
        sed -i '' "s/CHANGE_ME_STRONG_PASSWORD/${DB_PASSWORD}/" .env
        sed -i '' "s/CHANGE_ME_REDIS_PASSWORD/${REDIS_PASSWORD}/" .env
    else
        sed -i "s/CHANGE_ME_GENERATE_RANDOM_SECRET_KEY_MINIMUM_32_CHARS/${JWT_SECRET}/" .env
        sed -i "s/CHANGE_ME_STRONG_PASSWORD/${DB_PASSWORD}/" .env
        sed -i "s/CHANGE_ME_REDIS_PASSWORD/${REDIS_PASSWORD}/" .env
    fi

    echo "✅ .env ファイルが作成されました（開発用ランダム値設定済み）"
    echo "⚠️  本番環境では必ず強力なパスワードに変更してください"
else
    echo "ℹ️  .env ファイルは既に存在します。"
fi

# 2. 環境変数チェック
echo "🔍 環境変数をチェックしています..."
source .env

# 必須変数の存在確認
MISSING_VARS=()
[ -z "$DB_PASSWORD" ] && MISSING_VARS+=("DB_PASSWORD")
[ -z "$REDIS_PASSWORD" ] && MISSING_VARS+=("REDIS_PASSWORD")
[ -z "$JWT_SECRET_KEY" ] && MISSING_VARS+=("JWT_SECRET_KEY")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ エラー: 以下の必須環境変数が設定されていません:"
    printf '  %s\n' "${MISSING_VARS[@]}"
    echo "💡 解決方法:"
    echo "  1. .env ファイルを削除して再実行: rm .env && ./scripts/setup.sh"
    echo "  2. または ./scripts/env-check.sh で詳細確認"
    exit 1
fi

# 3. 依存関係のインストール
echo "📦 依存関係をインストールしています..."

if [ ! -f "package.json" ]; then
    echo "❌ エラー: package.json が見つかりません"
    echo "💡 プロジェクト構成を確認してください"
    exit 1
fi

pnpm install

# 4. Git フックの設定（Huskyを使用）
if [ -f "node_modules/.bin/husky" ] && [ -d ".husky" ]; then
    echo "🔧 Git フック（Husky）が利用可能です"
else
    echo "⚠️  Huskyが見つかりません。Git フックはセットアップされません"
fi

# 5. TypeScript設定チェック
echo "🔧 TypeScript設定をチェックしています..."
if [ ! -f "tsconfig.json" ]; then
    echo "⚠️  tsconfig.json が見つかりません"
else
    echo "✅ TypeScript設定が確認されました"
fi

# 6. Docker環境のビルド
echo "🐳 Docker環境をビルドしています..."
if ! docker-compose build; then
    echo "❌ エラー: Docker環境のビルドに失敗しました"
    echo "💡 解決方法:"
    echo "  1. docker-compose.yml ファイルの存在確認"
    echo "  2. Dockerデーモンの起動確認: docker version"
    echo "  3. ディスク容量の確認: df -h"
    exit 1
fi

# 7. データベースとRedisの初期化
echo "🗄️  データベースサービスを起動しています..."
docker-compose up -d simpletask-nestjs-db simpletask-nestjs-redis

# ヘルスチェック待機
echo "⏳ データベースの起動を待機しています..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T simpletask-nestjs-db pg_isready -U ${DB_USER:-postgres} > /dev/null 2>&1; then
        echo "✅ データベースが利用可能になりました"
        break
    fi
    echo "   待機中... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  データベースの起動確認がタイムアウトしました"
    echo "💡 解決方法:"
    echo "  1. docker-compose logs simpletask-nestjs-db でログ確認"
    echo "  2. ポート5432が使用されていないか確認: lsof -i :5432"
    echo "  3. 手動でサービス確認: docker-compose ps"
fi

# 8. データベースマイグレーション（TypeORMを使用している場合）
if [ -d "database/migrations" ] || [ -d "src/migrations" ]; then
    echo "🔄 データベースマイグレーションを実行しています..."
    if docker-compose exec -T simpletask-nestjs-api pnpm run migration:run > /dev/null 2>&1; then
        echo "✅ マイグレーションが完了しました"
    else
        echo "⚠️  マイグレーションをスキップします"
        echo "💡 アプリケーション起動後に make migrate を実行してください"
    fi
fi

echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "📋 環境構成:"
echo "  Node.js: v$NODE_VERSION (Volta管理)"
echo "  pnpm: $PNPM_VERSION (Volta管理)"
echo "  環境設定: .env (開発用設定)"
echo ""
echo "🚀 次のステップ:"
echo "1. VSCodeでプロジェクトを開く: code ."
echo "2. 推奨拡張機能をインストール (Ctrl+Shift+P → 'Extensions: Show Recommended Extensions')"
echo "3. make docker-up でアプリケーションを起動"
echo "4. http://localhost:8000/docs でAPI仕様を確認"
echo "5. http://localhost:8000/health でヘルスチェック"
echo ""
echo "🛠️  開発コマンド:"
echo "  make help       - 利用可能なコマンド一覧"
echo "  make format     - コードフォーマット"
echo "  make lint       - Lintチェック"
echo "  make test       - テスト実行"
echo "  make all-checks - 全チェック実行"
echo ""
echo "🔧 Volta コマンド:"
echo "  volta list      - インストール済みツール確認"
echo "  volta pin node  - Node.js バージョン固定"
echo "  volta pin pnpm  - pnpm バージョン固定"
echo ""
echo "🔒 セキュリティコマンド:"
echo "  ./scripts/env-check.sh     - 環境変数チェック"
echo "  make generate-secrets      - 本番用秘密鍵生成"
echo ""
echo "💡 トラブルシューティング:"
echo "  make docker-logs           - ログ確認"
echo "  make docker-restart        - サービス再起動"
echo "  ./scripts/dev.sh status    - サービス状況確認"
