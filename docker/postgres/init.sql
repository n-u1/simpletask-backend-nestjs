-- SimpleTask PostgreSQL 初期化スクリプト
-- Docker起動時に自動実行される

-- データベースが存在しない場合のみ作成
SELECT 'CREATE DATABASE simpletask'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'simpletask')\gexec

-- テスト用データベースも作成
SELECT 'CREATE DATABASE simpletask_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'simpletask_test')\gexec

-- UUIDエクステンションの有効化（全データベース）
\c simpletask;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

\c simpletask_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- メインデータベースに戻る
\c simpletask;

-- 基本的な設定
SET timezone = 'UTC';

-- ログ設定
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1秒以上のクエリをログ

-- パフォーマンス設定
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET track_functions = 'all';

-- 接続設定
ALTER SYSTEM SET max_connections = 100;

-- メモリ設定（開発環境用）
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- チェックポイント設定
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';

-- 統計情報設定
ALTER SYSTEM SET default_statistics_target = 100;

-- 設定リロード
SELECT pg_reload_conf();

-- 初期化完了メッセージ
\echo 'SimpleTask PostgreSQL initialization completed successfully!'
\echo 'Databases created: simpletask, simpletask_test'
\echo 'Extensions enabled: uuid-ossp, pg_stat_statements'
\echo 'Performance settings optimized for development'