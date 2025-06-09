/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
/**
 * Jestテスト環境セットアップ
 * 全テストで共通的に使用される設定・モック・ヘルパー
 */

import { randomUUID } from 'crypto';

import { config } from 'dotenv';
import 'reflect-metadata';

// テスト環境用の環境変数読み込み
config({ path: '.env.test' });

// グローバルテストタイムアウト設定
jest.setTimeout(30000);

// データベーステスト用のセットアップ
beforeAll((): void => {
  // テスト用データベース接続確認
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/simpletask_test';
});

afterAll((): void => {
  // クリーンアップ処理
});

// コンソールの警告・エラーをフィルタリング
const originalConsoleWarn: typeof console.warn = console.warn;
const originalConsoleError: typeof console.error = console.error;

console.warn = (...args: unknown[]): void => {
  // 特定の警告をフィルタ
  const message = args[0];
  if (typeof message === 'string') {
    // TypeORM実験的機能の警告を抑制
    if (message.includes('experimental')) {
      return;
    }
    // Nest.js開発時警告を抑制
    if (message.includes('Warning: ReactDOM.render')) {
      return;
    }
  }
  originalConsoleWarn(...args);
};

console.error = (...args: unknown[]): void => {
  // 特定のエラーをフィルタ
  const message = args[0];
  if (typeof message === 'string') {
    // 予期されるテストエラーを抑制
    if (message.includes('Test error')) {
      return;
    }
  }
  originalConsoleError(...args);
};

// グローバルモック設定
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    disconnect: jest.fn(),
  }));
});

// 日時モック用ヘルパー
export const mockDate = (date: string | Date): jest.SpyInstance => {
  const targetDate = new Date(date);
  const spy = jest.spyOn(global.Date, 'now').mockReturnValue(targetDate.getTime());
  return spy;
};

// テスト用ユーティリティ
export const testUtils = {
  // ランダムなメールアドレス生成
  randomEmail: (): string => `test-${Math.random().toString(36).substring(2, 11)}@example.com`,

  // ランダムなUUID生成
  randomUuid: (): string => {
    return randomUUID();
  },

  // 待機ヘルパー
  wait: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

  // テスト用パスワード
  testPassword: 'Test123!@#',

  // テスト用ユーザーデータ
  createTestUser: (): {
    email: string;
    password: string;
    displayName: string;
  } => ({
    email: testUtils.randomEmail(),
    password: testUtils.testPassword,
    displayName: 'テストユーザー',
  }),

  // テスト用タスクデータ
  createTestTask: (): {
    title: string;
    description: string;
    status: string;
    priority: string;
  } => ({
    title: 'テストタスク',
    description: 'テスト用のタスクです',
    status: 'todo',
    priority: 'medium',
  }),

  // テスト用タグデータ
  createTestTag: (): {
    name: string;
    color: string;
    description: string;
  } => ({
    name: 'テストタグ',
    color: '#3B82F6',
    description: 'テスト用のタグです',
  }),
};

// 非同期テスト用ヘルパー
export const expectAsync = {
  toResolve: async (promise: Promise<unknown>): Promise<void> => {
    await expect(promise).resolves.toBeDefined();
  },

  toReject: async (promise: Promise<unknown>): Promise<void> => {
    await expect(promise).rejects.toBeDefined();
  },

  toRejectWith: async (promise: Promise<unknown>, error: Error | string): Promise<void> => {
    await expect(promise).rejects.toThrow(error);
  },
};

// テストデータベースヘルパー
export const dbTestUtils = {
  // テーブル全削除
  clearAllTables: async (dataSource: {
    entityMetadatas: Array<{ name: string }>;
    getRepository: (name: string) => { clear: () => Promise<void> };
  }): Promise<void> => {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  },

  // 外部キー制約一時無効化
  disableForeignKeys: async (dataSource: { query: (sql: string) => Promise<void> }): Promise<void> => {
    await dataSource.query('SET session_replication_role = replica;');
  },

  // 外部キー制約再有効化
  enableForeignKeys: async (dataSource: { query: (sql: string) => Promise<void> }): Promise<void> => {
    await dataSource.query('SET session_replication_role = DEFAULT;');
  },
};

// Nest.jsテスト用ヘルパー
export const nestTestUtils = {
  // テスト用モジュール作成ヘルパー
  createTestingModule: async (imports: any[] = [], providers: any[] = []): Promise<any> => {
    const { Test } = await import('@nestjs/testing');

    return Test.createTestingModule({
      imports,
      providers,
    }).compile();
  },

  // モックサービス作成
  createMockService: <T extends Record<string, unknown>>(methods: Array<keyof T>): jest.Mocked<T> => {
    const mock = {} as jest.Mocked<T>;
    methods.forEach(method => {
      (mock[method] as jest.Mock) = jest.fn();
    });
    return mock;
  },
};
