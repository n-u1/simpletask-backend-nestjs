import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions, LogLevel } from 'typeorm';

const configService = new ConfigService();
const logger = new Logger('TestDataSource');

const isProduction = configService.get('NODE_ENV') === 'production';
const isTest = configService.get('NODE_ENV') === 'test';
const isDevelopment = configService.get('NODE_ENV') === 'development';

// データベースURL構築
const buildDatabaseUrl = (): string => {
  const user = configService.getOrThrow<string>('DB_USER');
  const password = configService.getOrThrow<string>('DB_PASSWORD');
  const host = configService.getOrThrow<string>('DB_HOST');
  const port = configService.getOrThrow<string>('DB_PORT');
  const database = configService.getOrThrow<string>('DB_NAME');

  // URLエンコーディングでパスワードの特殊文字対応
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
};

const getNumericConfig = (key: string, defaultValue: number): number => {
  const value = Number(configService.get(key, defaultValue));
  if (isNaN(value) || value <= 0) {
    throw new Error(`Invalid configuration value for ${key}: ${configService.get(key)}`);
  }
  return value;
};

const getEntityPaths = (): string[] => {
  if (isProduction) {
    return ['../../dist/**/*.entity.js'];
  }
  return ['../../src/**/*.entity.ts'];
};

const getMigrationPaths = (): string[] => {
  if (isProduction) {
    return ['../../dist/database/migrations/*.js'];
  }
  return ['../../database/migrations/*.ts'];
};

const getSSLConfig = (): boolean | Record<string, unknown> => {
  if (!isProduction) {
    return false;
  }

  const sslConfig: Record<string, unknown> = {
    rejectUnauthorized: true,
  };

  // オプショナルなSSL設定
  const ca = configService.get<string>('DB_SSL_CA');
  const cert = configService.get<string>('DB_SSL_CERT');
  const key = configService.get<string>('DB_SSL_KEY');

  if (ca) {
    sslConfig.ca = ca;
  }
  if (cert) {
    sslConfig.cert = cert;
  }
  if (key) {
    sslConfig.key = key;
  }

  return sslConfig;
};

const getCacheConfig = (): false | Record<string, unknown> => {
  // テスト環境ではキャッシュ無効
  if (!isProduction || isTest) {
    return false;
  }

  return {
    type: 'redis',
    options: {
      host: configService.getOrThrow<string>('REDIS_HOST'),
      port: getNumericConfig('REDIS_PORT', 6379),
      password: configService.getOrThrow<string>('REDIS_PASSWORD'),
      db: getNumericConfig('REDIS_DB', 1),
    },
    duration: 30000, // 30秒
  };
};

// ログ設定構築
const getLoggingConfig = (): boolean | LogLevel[] => {
  if (isTest) {
    return false; // テスト時はログ無効
  }

  if (isDevelopment) {
    return ['query', 'error', 'warn'] as LogLevel[];
  }

  return ['error', 'warn'] as LogLevel[]; // 本番環境
};

interface PoolConfig {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  application_name: string;
  statement_timeout: number;
  query_timeout: number;
  keepAlive: boolean;
  keepAliveInitialDelayMillis: number;
}

const getBaseConfig = (): Partial<DataSourceOptions> => ({
  type: 'postgres',
  url: buildDatabaseUrl(),
  ssl: getSSLConfig(),
  entities: getEntityPaths(),
  migrations: getMigrationPaths(),
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false, // 手動実行
  synchronize: false, // マイグレーションを使用
  dropSchema: isTest, // テスト環境でのみtrue
  logging: getLoggingConfig(),
  cache: getCacheConfig(),
});

const getPoolConfig = (): PoolConfig => ({
  // PostgreSQL pg ライブラリの接続プール設定
  max: getNumericConfig('DB_POOL_SIZE', 3),
  min: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
  // PostgreSQL固有設定
  application_name: `simpletask-nestjs-test-${configService.get('NODE_ENV', 'test')}`,
  statement_timeout: 10000,
  query_timeout: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});

const TestDataSource = new DataSource({
  ...getBaseConfig(),
  extra: getPoolConfig(),
} as DataSourceOptions);

export const initializeTestDataSource = async (): Promise<void> => {
  try {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();

      // 接続テスト
      await TestDataSource.query('SELECT 1');

      logger.log(`Test database connection established successfully (${configService.get('NODE_ENV')} mode)`);
    }
  } catch (error) {
    logger.error('Test database connection failed:', error);
    throw new Error(`Failed to connect to test database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const checkTestDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!TestDataSource.isInitialized) {
      return false;
    }

    await TestDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Test database health check failed:', error);
    return false;
  }
};

export const destroyTestDataSource = async (): Promise<void> => {
  try {
    if (TestDataSource.isInitialized) {
      // 進行中のクエリ完了を待つ
      await new Promise(resolve => setTimeout(resolve, 500)); // テスト用に短縮

      await TestDataSource.destroy();
      logger.log('Test database connection closed successfully');
    }
  } catch (error) {
    logger.error('Error closing test database connection:', error);
    throw error;
  }
};

// テスト用のデータベースクリーンアップヘルパー
export const cleanTestDatabase = async (): Promise<void> => {
  if (!TestDataSource.isInitialized) {
    await initializeTestDataSource();
  }

  try {
    // 外部キー制約を一時的に無効化
    await TestDataSource.query('SET session_replication_role = replica');

    // 全テーブルのデータを削除（テーブル構造は保持）
    const entities = TestDataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.target);
      await repository.clear();
    }

    // 外部キー制約を再有効化
    await TestDataSource.query('SET session_replication_role = DEFAULT');

    logger.log('Test database cleaned successfully');
  } catch (error) {
    logger.error('Failed to clean test database:', error);
    throw error;
  }
};

export default TestDataSource;
