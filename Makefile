.PHONY: help setup check-node install format lint test test-cov test-auth test-crud test-integrity test-failed test-debug clean docker-build docker-up docker-down docker-test migrate env-check security generate-secrets all-checks

help: ## ヘルプを表示
	@echo "利用可能なコマンド:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# セットアップ関連
setup: ## 初回環境セットアップ
	@echo "🚀 初回環境セットアップを開始します..."
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

check-node: ## Node.jsバージョンチェック
	@node --version | grep -q "v22" || (echo "❌ Node.js 22.x が必要です" && exit 1)
	@echo "✅ Node.js バージョンOK"
	@pnpm --version > /dev/null || (echo "❌ pnpm が必要です" && exit 1)
	@echo "✅ pnpm バージョンOK"

check-volta: ## Voltaバージョンチェック
	@volta --version > /dev/null || (echo "❌ Volta が必要です" && exit 1)
	@echo "✅ Volta バージョンOK"

install: ## 依存関係をインストール
	pnpm install
	@echo "✅ 依存関係のインストールが完了しました"

format: ## コードをフォーマット
	pnpm run format

format-check: ## フォーマットチェック
	pnpm run format:check

lint: ## Lintチェックを実行
	pnpm run lint:check

lint-fix: ## Lint自動修正
	pnpm run lint

type-check: ## TypeScript型チェック
	pnpm run type-check

# 基本テストコマンド
test: ## 全テストを実行
	pnpm run test

test-watch: ## テストをwatchモードで実行
	pnpm run test:watch

test-cov: ## カバレッジ付きテストを実行
	pnpm run test:cov

# 個別テストカテゴリ
test-auth: ## 認証関連テストのみ実行
	pnpm run test -- --testPathPattern=auth

test-crud: ## CRUD操作テストのみ実行
	pnpm run test -- --testPathPattern="(tasks|tags).*crud"

test-integrity: ## データ整合性テストのみ実行
	pnpm run test -- --testPathPattern=integrity

test-e2e: ## E2Eテストを実行
	pnpm run test:e2e

# デバッグ・開発用
test-failed: ## 前回失敗したテストのみ再実行
	pnpm run test -- --onlyFailures

test-debug: ## デバッグモードでテスト実行
	pnpm run test:debug

clean: ## キャッシュファイルを削除
	rm -rf node_modules/.cache
	rm -rf dist
	rm -rf coverage
	rm -rf .nyc_output
	rm -rf reports/

clean-all: ## 全依存関係とキャッシュを削除
	rm -rf node_modules
	rm -rf dist
	rm -rf coverage
	rm -rf .nyc_output
	rm -rf pnpm-lock.yaml

# ビルド関連
build: ## アプリケーションをビルド
	pnpm run build

start: ## アプリケーションを起動（開発モード）
	pnpm run start:dev

start-prod: ## アプリケーションを起動（本番モード）
	pnpm run start:prod

# Docker関連
docker-build: ## Dockerイメージをビルド
	docker-compose build

docker-up: ## Docker環境を起動
	docker-compose up -d

docker-down: ## Docker環境を停止
	docker-compose down

docker-restart: ## Docker環境を再起動
	@$(MAKE) docker-down
	@$(MAKE) docker-up

docker-logs: ## Dockerログを表示
	docker-compose logs -f

docker-logs-api: ## APIサービスのログのみ表示
	docker-compose logs -f simpletask-nestjs-api

docker-logs-db: ## DBサービスのログのみ表示
	docker-compose logs -f simpletask-nestjs-db

docker-test: ## Docker環境でテスト実行
	docker-compose exec simpletask-nestjs-api pnpm run test

docker-shell: ## APIコンテナのシェルに接続
	docker-compose exec simpletask-nestjs-api sh

docker-clean: ## Docker環境をクリーンアップ
	docker-compose down -v
	docker system prune -f

# データベース関連
migrate: ## データベースマイグレーション
	docker-compose exec simpletask-nestjs-api pnpm run migration:run

migrate-generate: ## マイグレーションファイル生成
	docker-compose exec simpletask-nestjs-api pnpm run migration:generate database/migrations/$(name)

migrate-revert: ## マイグレーション取り消し
	docker-compose exec simpletask-nestjs-api pnpm run migration:revert

seed: ## サンプルデータ投入
	docker-compose exec simpletask-nestjs-api pnpm run seed

db-shell: ## データベースに接続
	docker-compose exec simpletask-nestjs-db psql -U postgres -d simpletask

redis-shell: ## Redisに接続
	docker-compose exec simpletask-nestjs-redis redis-cli -a "$(shell grep REDIS_PASSWORD .env | cut -d= -f2)"

# 環境・セキュリティチェック
env-check: ## 環境変数チェック
	@chmod +x scripts/env-check.sh
	@./scripts/env-check.sh

security: ## セキュリティチェック
	pnpm audit
	@echo "🔍 依存関係のセキュリティチェック完了"

generate-secrets: ## 本番用秘密鍵生成
	@chmod +x scripts/generate-secrets.sh
	@./scripts/generate-secrets.sh

# 総合チェック
all-checks: lint type-check test security ## 全チェックを実行
	@echo "✅ すべてのチェックが完了しました"

# 開発フロー
dev: docker-up ## 開発環境を起動
	@echo "🚀 開発環境が起動しました"
	@echo "📖 API仕様: http://localhost:8000/docs"
	@echo "❤️  ヘルスチェック: http://localhost:8000/health"
	@echo "🗄️  データベース: localhost:5432"
	@echo "🔴 Redis: localhost:6379"

dev-logs: ## 開発環境のログを表示
	@$(MAKE) docker-logs

dev-status: ## 開発環境の状況確認
	@echo "📊 Docker サービス状況:"
	@docker-compose ps
	@echo ""
	@echo "🌐 エンドポイント確認:"
	@curl -s http://localhost:8000/health | head -1 || echo "❌ API応答なし"

reset: ## 開発環境をリセット
	@echo "⚠️  開発環境をリセットします（データも削除されます）"
	@read -p "続行しますか？ [y/N]: " confirm && [ "$$confirm" = "y" ]
	@$(MAKE) docker-down
	@docker-compose down -v
	@$(MAKE) clean
	@echo "✅ 開発環境がリセットされました"
	@echo "💡 再セットアップは 'make setup' を実行してください"

# 本番環境関連
prod-build: ## 本番用Dockerイメージをビルド
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## 本番環境を起動
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## 本番環境を停止
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# バックアップ・復元
backup: ## データベースをバックアップ
	@mkdir -p backups
	@docker-compose exec -T simpletask-nestjs-db pg_dump -U postgres simpletask > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ バックアップ完了: backups/backup_$(shell date +%Y%m%d_%H%M%S).sql"

restore: ## データベースを復元（要ファイル指定: make restore file=backup.sql）
	@if [ -z "$(file)" ]; then echo "❌ ファイルを指定してください: make restore file=backup.sql"; exit 1; fi
	@docker-compose exec -T simpletask-nestjs-db psql -U postgres -d simpletask < $(file)
	@echo "✅ 復元完了: $(file)"

# CI/CD関連
ci-install: ## CI環境での依存関係インストール
	pnpm install --frozen-lockfile

ci-test: ## CI環境でのテスト実行
	pnpm run test:cov

ci-build: ## CI環境でのビルド
	pnpm run build

# 開発支援
update: ## 依存関係を更新
	pnpm update
	@echo "✅ 依存関係更新完了"

outdated: ## 古くなった依存関係をチェック
	pnpm outdated

info: ## プロジェクト情報を表示
	@echo "📋 SimpleTask Nest.js Backend"
	@echo "🏷️  バージョン: $(shell node -p "require('./package.json').version")"
	@echo "🟢 Node.js: $(shell node --version)"
	@echo "📦 pnpm: $(shell pnpm --version)"
	@echo "🔧 Volta: $(shell volta --version 2>/dev/null || echo 'not installed')"
	@echo "🐳 Docker: $(shell docker --version | cut -d' ' -f3 | tr -d ',')"
	@echo "📁 プロジェクトディレクトリ: $(PWD)"

# ヘルスチェック
health: ## アプリケーションのヘルスチェック
	@echo "🏥 ヘルスチェック実行中..."
	@curl -s http://localhost:8000/health || echo "❌ アプリケーションが応答していません"
	@docker-compose exec -T simpletask-nestjs-db pg_isready -U postgres || echo "❌ データベースが応答していません"
	@docker-compose exec -T simpletask-nestjs-redis redis-cli ping || echo "❌ Redisが応答していません"

# 開発環境管理用ショートカット
quick-start: check-node install docker-up ## クイックスタート（Node.js確認→依存関係→Docker起動）
	@echo "🎉 クイックスタート完了！"
	@$(MAKE) dev-status

# Volta関連
volta-pin: ## 現在のNode.js/pnpmバージョンをプロジェクトに固定
	volta pin node
	volta pin pnpm
	@echo "✅ Volta設定をプロジェクトに固定しました"

volta-install: ## プロジェクト指定のNode.js/pnpmをインストール
	volta install node
	volta install pnpm
	@echo "✅ プロジェクト指定バージョンをインストールしました"
