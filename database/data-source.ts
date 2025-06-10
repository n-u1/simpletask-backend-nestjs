import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions, LogLevel } from 'typeorm';

config();

const configService = new ConfigService();
const logger = new Logger('DataSource');

const isProduction = configService.get('NODE_ENV') === 'production';
const isTest = configService.get('NODE_ENV') === 'test';
const isDevelopment = configService.get('NODE_ENV') === 'development';

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
    return ['dist/**/*.entity.js'];
  }
  return ['src/**/*.entity.ts'];
};

const getMigrationPaths = (): string[] => {
  if (isProduction) {
    return ['dist/database/migrations/*.js'];
  }
  return ['database/migrations/*.ts'];
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
      db: getNumericConfig('REDIS_DB', 1), // キャッシュ用は別DB
    },
    duration: 30000, // 30秒
  };
};

const getLoggingConfig = (): boolean | LogLevel[] => {
  if (isTest) {
    return false; // テスト時はログ無効
  }

  if (isDevelopment) {
    return ['query', 'error', 'warn'] as LogLevel[];
  }

  return ['error', 'warn'] as LogLevel[]; // 本番環境
};

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

const getPoolConfig = (): PoolConfig => ({
  // PostgreSQL pg ライブラリの接続プール設定
  max: getNumericConfig('DB_POOL_SIZE', 5),
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  // PostgreSQL固有設定
  application_name: `simpletask-nestjs-${configService.get('NODE_ENV', 'development')}`,
  statement_timeout: 30000, // 30秒
  query_timeout: 30000, // 30秒
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});

export const AppDataSource = new DataSource({
  ...getBaseConfig(),
  extra: getPoolConfig(),
} as DataSourceOptions);

export const initializeDataSource = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();

      // 接続テスト
      await AppDataSource.query('SELECT 1');

      logger.log(`Database connection established successfully (${configService.get('NODE_ENV')} mode)`);
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }

    await AppDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

export const destroyDataSource = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      // 進行中のクエリ完了を待つ
      await new Promise(resolve => setTimeout(resolve, 1000));

      await AppDataSource.destroy();
      logger.log('Database connection closed successfully');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default AppDataSource;
