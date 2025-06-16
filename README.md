# SimpleTask Backend

Web アプリケーション「SimpleTask」の REST API（バックエンド）です。  
個人タスク管理用のアプリケーションを想定しています。

## 🎯 プロジェクト概要

NestJS を用いたバックエンド開発を試行する個人プロジェクトです。  
サーバーサイド JS や NestJS への理解を深めることを目的としています。

Python の FastAPI でも別途同じアプリケーションをテーマに開発を行っているため、  
基本的な内容はそちらに準ずる形とし、技術スタックを NestJS に変えて実装する。

関連リンク: [FastAPI版「SimpleTask」](ttps://github.com/n-u1/simpletask-backend-fastapi)

### プロジェクトの方針

- プロジェクトの趣旨に照らし、TypeScript と NestJS を使用する
- その他の技術スタックは一般的なもの・勢いのあるものから選定する
- 個人開発ではあるが実務も意識した開発を行う
- フロントエンドとバックエンドは分離した構成とし、当リポジトリではフロントエンドは実装しない
- API については REST 形式とし、OpenAPI 仕様でドキュメント化する

### アプリケーションの選定基準

- 個人プロジェクトとしてちょうどよい規模感であること（大き過ぎず小さ過ぎない）
- 機能は絞るが一般的なシステムで求められる基本機能は含まれること（CRUD 操作や認証など）
- 拡張性やカスタマイズ性があること（あとから機能拡張する可能性もあるため）

### アプリケーションの主な機能

- **ユーザー認証** - JWT トークンベース認証
- **タスク管理** - CRUD 操作、ステータス管理、優先度設定
- **タグ機能** - タスクの分類・検索機能
- **並び替え機能** - カンバンボードを想定した並び替え機能

## 🛠 技術スタック

### Backend

- **NestJS** - TypeScript ベースの Node.js フレームワーク
- **TypeORM** - TypeScript 対応の ORM
- **PostgreSQL** - メインデータベース
- **Redis** - セッション管理・キャッシュ（ioredis + cache-manager）
- **TypeORM CLI** - データベースマイグレーション
- **class-validator** - データバリデーション

### Development & Infrastructure

- **Docker** - コンテナ化
- **Jest** - テストフレームワーク
- **ESLint & Prettier** - Linter & Formatter
- **TypeScript** - 型チェック
- **Husky & lint-staged** - Git フック管理
- **Swagger** - API ドキュメント生成・表示

## 🏗 アーキテクチャ

NestJSが推奨しているアーキテクチャやパターンに基づく

- 関心を分離するレイヤードアーキテクチャ
- 拡張やテストを容易にするモジュールベースアーキテクチャ
- DI（依存性注入）による疎結合な設計
- DTOとバリデーションによる型安全の確保

## 🚀 クイックスタート

### 前提条件

- **Node.js 22.16.0**
- **pnpm 10.12.1**
- **Docker & Docker Compose**
- **Git**
- **Volta** (推奨)

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/n-u1/simpletask-backend-nestjs.git
cd simpletask-backend-nestjs

# 環境構築・起動
make setup
make docker-up
make migrate

# 動作確認
# API仕様: http://localhost:8000/docs
# ヘルスチェック: http://localhost:8000/health
```

### 🎉 完了

正常に完了すれば開発環境が準備できます

---

### 環境別の実行方法

**Windows (make コマンドが使えない場合):**

```bash
bash scripts/setup.sh
docker-compose up -d
docker-compose exec simpletask-nestjs-api pnpm run migration:run
```

### トラブルシューティング

**Node.js バージョンエラー** → `volta install node@22.16.0 && volta pin node`  
**pnpm エラー** → `volta install pnpm@10.12.1 && volta pin pnpm`  
**Docker エラー** → [Docker Desktop](https://docs.docker.com/get-docker/) をインストール  
**ポート 8000 エラー** → `lsof -i :8000` で使用中プロセス確認  
**その他** → `make docker-logs` でログ確認

## 🧪 開発コマンド

```bash
make install     # 依存関係インストール
make docker-up   # Dockerコンテナ起動（make devでも可）
make docker-down # Dockerコンテナ停止
make migrate     # マイグレーション（初回とボリューム削除した際）
make lint        # Lintチェック
make format      # コードフォーマット
make test        # テスト実行
make type-check  # TypeScript型チェック
make help        # コマンド一覧

# Volta関連
make volta-pin   # バージョン固定
make volta-install # プロジェクト指定バージョンインストール
```

### 今後の実装予定

! 開発中のため未実装の機能や処理があります !

- [x] ベース環境の構築
- [ ] 共通機能の実装
- [ ] 認証機能の実装
- [ ] ユーザーモジュールの実装
- [ ] タスクモジュールの実装
- [ ] タグモジュールの実装
- [ ] テストの作成
