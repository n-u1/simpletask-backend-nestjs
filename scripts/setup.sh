#!/bin/bash

# SimpleTask Backend セットアップスクリプト

set -e

echo "🚀 SimpleTask Backend セットアップを開始します..."

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ エラー: $1 がインストールされていません"
        echo "💡 インストール方法:"
        case "$1" in
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

get_required_versions() {
    if [ ! -f "package.json" ]; then
        echo "❌ エラー: package.json が見つかりません"
        echo "💡 プロジェクトルートで実行していることを確認してください"
        exit 1
    fi

    # package.jsonから要求バージョンの情報を取得
    if command -v node &> /dev/null; then
        REQUIRED_NODE=$(node -p "
            try {
                const pkg = require('./package.json');
                pkg.volta?.node || pkg.engines?.node || '22.16.0'
            } catch(e) {
                '22.16.0'
            }
        " 2>/dev/null || echo "22.16.0")

        REQUIRED_PNPM=$(node -p "
            try {
                const pkg = require('./package.json');
                pkg.volta?.pnpm || pkg.engines?.pnpm || pkg.packageManager?.replace('pnpm@', '') || '10.12.1'
            } catch(e) {
                '10.12.1'
            }
        " 2>/dev/null || echo "10.12.1")
    else
        # Node.jsがない場合はデフォルト値を使用
        REQUIRED_NODE="22.16.0"
        REQUIRED_PNPM="10.12.1"
    fi

    echo "📋 package.jsonから読み取った要求バージョン:"
    echo "  Node.js: $REQUIRED_NODE"
    echo "  pnpm: $REQUIRED_PNPM"
    echo ""
}

# Volta環境での処理
handle_volta_environment() {
    echo "🔧 Voltaを使用します"

    # Voltaのセットアップ確認
    if ! node --version &> /dev/null || ! pnpm --version &> /dev/null; then
        echo "⚠️  VoltaのPATH設定が必要な可能性があります"
        echo "💡 以下のコマンドを実行してからスクリプトを再実行してください："
        echo "   volta setup"
        echo "   # 新しいターミナルを開いて再実行"
        exit 1
    fi

    # 現在のバージョンを確認
    CURRENT_NODE=$(node --version | sed 's/v//')
    CURRENT_PNPM=$(pnpm --version)

    echo "📋 現在のバージョン:"
    echo "  Node.js: v$CURRENT_NODE"
    echo "  pnpm: $CURRENT_PNPM"

    # Node.jsバージョンチェック
    if [[ "$CURRENT_NODE" != "$REQUIRED_NODE" ]]; then
        echo "⚠️  Node.js バージョンが一致しません"
        echo "   現在: $CURRENT_NODE"
        echo "   要求: $REQUIRED_NODE"
        echo ""
        show_volta_node_install_guide
        exit 1
    else
        echo "✅ Node.js バージョン確認: $CURRENT_NODE"
    fi

    # pnpmバージョンチェック
    if [[ "$CURRENT_PNPM" != "$REQUIRED_PNPM" ]]; then
        echo "⚠️  pnpm バージョンが一致しません"
        echo "   現在: $CURRENT_PNPM"
        echo "   要求: $REQUIRED_PNPM"
        echo ""
        show_volta_pnpm_install_guide
        exit 1
    else
        echo "✅ pnpm バージョン確認: $CURRENT_PNPM"
    fi

    # Volta プロジェクト設定確認
    echo "🔧 Volta プロジェクト設定を確認中..."
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        // volta設定を更新
        pkg.volta = pkg.volta || {};
        pkg.volta.node = '$CURRENT_NODE';
        pkg.volta.pnpm = '$CURRENT_PNPM';

        // packageManager設定を更新
        pkg.packageManager = 'pnpm@$CURRENT_PNPM';

        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ package.json の Volta/packageManager 設定を更新しました');
    "
}

# Voltaインストールガイド（Node.js用）
show_volta_node_install_guide() {
    echo "🔧 Node.js $REQUIRED_NODE のインストール方法（Volta使用時）:"
    echo ""
    echo "1️⃣ Node.jsインストール:"
    echo "   volta install node@$REQUIRED_NODE"
    echo ""
    echo "2️⃣ プロジェクトに固定:"
    echo "   volta pin node@$REQUIRED_NODE"
    echo ""
    echo "💡 インストール後、新しいターミナルを開いてスクリプトを再実行してください"
}

# Voltaインストールガイド（pnpm用）
show_volta_pnpm_install_guide() {
    echo "🔧 pnpm $REQUIRED_PNPM のインストール方法（Volta使用時）:"
    echo ""
    echo "⚠️  注意: pnpmはVoltaで実験的サポートのため、事前設定が必要です"
    echo ""
    echo "1️⃣ 実験的機能を有効化:"
    echo "   # macOS/Linux の場合（~/.bashrc、~/.zshrc等に追加）"
    echo "   export VOLTA_FEATURE_PNPM=1"
    echo ""
    echo "   # Windows の場合（システム設定 → 環境変数で追加）"
    echo "   VOLTA_FEATURE_PNPM=1"
    echo ""
    echo "2️⃣ シェルを再起動後、pnpmインストール:"
    echo "   volta install pnpm@$REQUIRED_PNPM"
    echo ""
    echo "3️⃣ プロジェクトに固定:"
    echo "   volta pin pnpm@$REQUIRED_PNPM"
    echo ""
    echo "💡 設定完了後、新しいターミナルを開いてスクリプトを再実行してください"
    echo "📖 詳細: https://docs.volta.sh/advanced/pnpm"
}

# 非Volta環境での処理
handle_non_volta_environment() {
    echo "ℹ️  システムのNode.js/pnpmを使用します"

    # Node.jsコマンドの存在確認
    if ! command -v node &> /dev/null; then
        echo "❌ エラー: node コマンドが見つかりません"
        show_node_install_guide
        exit 1
    fi

    # pnpmコマンドの存在確認
    if ! command -v pnpm &> /dev/null; then
        echo "❌ エラー: pnpm コマンドが見つかりません"
        show_pnpm_install_guide
        exit 1
    fi

    # 現在のバージョン取得・チェック
    CURRENT_NODE=$(node --version | sed 's/v//')
    CURRENT_PNPM=$(pnpm --version)

    echo "📋 現在のバージョン:"
    echo "  Node.js: v$CURRENT_NODE"
    echo "  pnpm: $CURRENT_PNPM"

    if [[ "$CURRENT_NODE" != "$REQUIRED_NODE" ]]; then
        echo "⚠️  Node.js バージョンが一致しません"
        echo "   現在のバージョン: $CURRENT_NODE"
        echo "   必要なバージョン: $REQUIRED_NODE"
        echo ""
        show_node_install_guide
    else
        echo "✅ Node.js バージョン確認: $CURRENT_NODE"
    fi

    if [[ "$CURRENT_PNPM" != "$REQUIRED_PNPM" ]]; then
        echo "⚠️  pnpm バージョンが一致しません"
        echo "   現在のバージョン: $CURRENT_PNPM"
        echo "   必要なバージョン: $REQUIRED_PNPM"
        echo ""
        show_pnpm_install_guide
    else
        echo "✅ pnpm バージョン確認: $CURRENT_PNPM"
    fi
}

# Node.jsインストールガイド
show_node_install_guide() {
    echo "🔧 Node.js $REQUIRED_NODE のインストール方法:"
    echo ""
    echo "1️⃣ Volta使用（推奨 - 正確なバージョン指定が可能）:"
    echo "   # Voltaインストール"
    echo "   curl https://get.volta.sh | bash         # Unix/Linux"
    echo "   brew install volta                       # macOS (Homebrew)"
    echo "   winget install Volta.Volta               # Windows"
    echo ""
    echo "   # 新しいターミナルで実行"
    echo "   volta install node@$REQUIRED_NODE"
    echo "   volta pin node@$REQUIRED_NODE"
    echo ""
    echo "2️⃣ 公式インストーラー（正確なバージョン指定）:"
    echo "   https://nodejs.org/en/download/releases/"
    echo ""
    echo "⚠️  重要な注意事項:"
    echo "   - パッケージマネージャーを使用した場合はマイナー/パッチバージョンが異なる可能性があります"
    echo "   - システムパッケージを使用した場合も必ずバージョンを確認してください"
    echo ""
    echo "💡 チーム開発では Volta の使用を強く推奨します（全員が同じバージョンを使用可能）"
}

# pnpmインストールガイド
show_pnpm_install_guide() {
    echo "🔧 pnpm $REQUIRED_PNPM のインストール方法:"
    echo ""
    echo "1️⃣ Volta使用（推奨）:"
    echo "   volta install pnpm@$REQUIRED_PNPM"
    echo "   volta pin pnpm@$REQUIRED_PNPM"
    echo ""
    echo "2️⃣ npm経由:"
    echo "   npm install -g pnpm@$REQUIRED_PNPM"
    echo ""
    echo "3️⃣ 公式インストーラー:"
    echo "   curl -fsSL https://get.pnpm.io/install.sh | sh -"
    echo ""
    echo "4️⃣ パッケージマネージャー:"
    echo "   brew install pnpm                        # macOS"
    echo "   winget install -e --id pnpm.pnpm         # Windows"
}

# 必要なコマンドの存在確認
echo "🔍 必要なツールの確認..."
check_command "docker"
check_command "docker-compose"
check_command "git"

# package.jsonから要求バージョンを取得
get_required_versions

# Volta環境の確認と処理
if command -v volta &> /dev/null; then
    echo "✅ Volta検出: バージョン管理を使用します"
    handle_volta_environment
else
    echo "💡 Volta推奨: プロジェクト指定バージョンの自動管理が可能です"
    echo "   インストール方法:"
    echo "     curl https://get.volta.sh | bash         # Unix/Linux"
    echo "     brew install volta                       # macOS (Homebrew)"
    echo "     winget install Volta.Volta               # Windows"
    echo "   詳細: https://volta.sh/"
    echo ""
    handle_non_volta_environment
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

echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "📋 環境構成:"
echo "  Node.js: v$CURRENT_NODE (Volta管理)"
echo "  pnpm: $CURRENT_PNPM (Volta管理)"
echo "  環境設定: .env (開発用設定)"
echo ""
echo "🚀 次のステップ:"
echo "1. make docker-up でアプリケーションを起動"
echo "2. make migrate でデータベースマイグレーション"
echo "3. VSCodeでプロジェクトを開く: code ."
echo "4. 推奨拡張機能をインストール (Ctrl+Shift+P → 'Extensions: Show Recommended Extensions')"
echo "5. http://localhost:8000/docs でAPI仕様を確認"
echo "6. http://localhost:8000/health でヘルスチェック"
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
