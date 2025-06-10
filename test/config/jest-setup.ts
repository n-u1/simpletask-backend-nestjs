/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
/**
 * Jestテスト環境セットアップ
 * 全テストで共通的に使用される設定・モック・ヘルパー
 */

import { randomUUID } from 'crypto';

import { config } from 'dotenv';
import 'reflect-metadata';

config({ path: '.env.test' });

jest.setTimeout(30000);

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

export const mockDate = (date: string | Date): jest.SpyInstance => {
  const targetDate = new Date(date);
  const spy = jest.spyOn(global.Date, 'now').mockReturnValue(targetDate.getTime());
  return spy;
};

export const testUtils = {
  randomEmail: (): string => `test-${Math.random().toString(36).substring(2, 11)}@example.com`,

  randomUuid: (): string => {
    return randomUUID();
  },

  wait: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

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

export const dbTestUtils = {
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
  createTestingModule: async (imports: any[] = [], providers: any[] = []): Promise<any> => {
    const { Test } = await import('@nestjs/testing');

    return Test.createTestingModule({
      imports,
      providers,
    }).compile();
  },

  createMockService: <T extends Record<string, unknown>>(methods: Array<keyof T>): jest.Mocked<T> => {
    const mock = {} as jest.Mocked<T>;
    methods.forEach(method => {
      (mock[method] as jest.Mock) = jest.fn();
    });
    return mock;
  },
};
