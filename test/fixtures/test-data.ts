/**
 * テストデータファクトリー
 * 各テストで使用するサンプルデータを生成
 */

import { randomUUID } from 'crypto';

import { TagConstants, TaskPriority, TaskStatus } from '@common/constants/app.constants';

// =============================================================================
// 基本ヘルパー関数
// =============================================================================

export const generateTestId = (): string => randomUUID();

export const generateTestEmail = (): string => `test-${Math.random().toString(36).substring(2, 11)}@example.com`;

export const generateTestString = (prefix = 'test', length = 8): string =>
  `${prefix}-${Math.random().toString(36).substring(2, length)}`;

// =============================================================================
// ユーザーテストデータ
// =============================================================================

export interface TestUserData {
  id?: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
}

export const createTestUserData = (overrides: Partial<TestUserData> = {}): TestUserData => ({
  id: generateTestId(),
  email: generateTestEmail(),
  password: 'TestPassword123!',
  displayName: 'テストユーザー',
  avatarUrl: null,
  isActive: true,
  isVerified: false,
  ...overrides,
});

export const createTestUsersData = (count: number): TestUserData[] =>
  Array.from({ length: count }, (_, index) => createTestUserData({ displayName: `テストユーザー${index + 1}` }));

// =============================================================================
// 認証テストデータ
// =============================================================================

export interface TestRegisterData {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
}

export interface TestLoginData {
  email: string;
  password: string;
}

export const createTestRegisterData = (overrides: Partial<TestRegisterData> = {}): TestRegisterData => ({
  email: generateTestEmail(),
  password: 'TestPassword123!',
  displayName: 'テストユーザー',
  ...overrides,
});

export const createTestLoginData = (overrides: Partial<TestLoginData> = {}): TestLoginData => ({
  email: generateTestEmail(),
  password: 'TestPassword123!',
  ...overrides,
});

// =============================================================================
// タスクテストデータ
// =============================================================================

export interface TestTaskData {
  id?: string;
  userId?: string | undefined;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  position: number;
  tagIds?: string[];
}

export const createTestTaskData = (overrides: Partial<TestTaskData> = {}): TestTaskData => ({
  id: generateTestId(),
  title: 'テストタスク',
  description: 'テスト用のタスクです',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  completedAt: null,
  position: 0,
  tagIds: [],
  ...overrides,
});

export const createTestTasksData = (count: number, userId?: string): TestTaskData[] =>
  Array.from({ length: count }, (_, index) =>
    createTestTaskData({
      userId,
      title: `テストタスク${index + 1}`,
      position: index,
    }),
  );

// 特定のステータスのタスクデータ
export const createCompletedTaskData = (overrides: Partial<TestTaskData> = {}): TestTaskData =>
  createTestTaskData({
    status: TaskStatus.DONE,
    completedAt: new Date(),
    ...overrides,
  });

export const createArchivedTaskData = (overrides: Partial<TestTaskData> = {}): TestTaskData =>
  createTestTaskData({
    status: TaskStatus.ARCHIVED,
    ...overrides,
  });

export const createOverdueTaskData = (overrides: Partial<TestTaskData> = {}): TestTaskData => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return createTestTaskData({
    status: TaskStatus.TODO,
    dueDate: yesterday,
    ...overrides,
  });
};

// =============================================================================
// タグテストデータ
// =============================================================================

export interface TestTagData {
  id?: string;
  userId?: string | undefined;
  name: string;
  color: string;
  description?: string | null;
  isActive?: boolean;
}

export const createTestTagData = (overrides: Partial<TestTagData> = {}): TestTagData => ({
  id: generateTestId(),
  name: 'テストタグ',
  color: TagConstants.DEFAULT_COLOR,
  description: 'テスト用のタグです',
  isActive: true,
  ...overrides,
});

export const createTestTagsData = (count: number, userId?: string): TestTagData[] =>
  Array.from({ length: count }, (_, index) =>
    createTestTagData({
      userId,
      name: `テストタグ${index + 1}`,
      color: TagConstants.PRESET_COLORS[index % TagConstants.PRESET_COLORS.length] ?? TagConstants.DEFAULT_COLOR,
    }),
  );

// =============================================================================
// JWT・認証テストデータ
// =============================================================================

export interface TestJwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

export const createTestJwtPayload = (overrides: Partial<TestJwtPayload> = {}): TestJwtPayload => ({
  sub: generateTestId(),
  type: 'access',
  jti: generateTestId(),
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
  ...overrides,
});

export const createTestRefreshJwtPayload = (userId: string): TestJwtPayload =>
  createTestJwtPayload({
    sub: userId,
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + 86400, // 24時間後
  });

// =============================================================================
// タスク・タグ関連付けテストデータ
// =============================================================================

export interface TestTaskTagData {
  id?: string;
  taskId: string;
  tagId: string;
}

export const createTestTaskTagData = (overrides: Partial<TestTaskTagData> = {}): TestTaskTagData => ({
  id: generateTestId(),
  taskId: generateTestId(),
  tagId: generateTestId(),
  ...overrides,
});

// =============================================================================
// バリデーションエラー用テストデータ
// =============================================================================

export const createInvalidUserData = (): {
  email: string;
  password: string;
  displayName: string;
} => ({
  email: 'invalid-email',
  password: '123', // 短すぎ
  displayName: '', // 空文字
});

export const createInvalidTaskData = (): {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
} => ({
  title: '', // 空文字
  status: 'invalid-status' as TaskStatus,
  priority: 'invalid-priority' as TaskPriority,
  position: -1, // 負の値
});

export const createInvalidTagData = (): {
  name: string;
  color: string;
} => ({
  name: '', // 空文字
  color: 'invalid-color', // 無効なカラーコード
});

// =============================================================================
// 日付・時間ヘルパー
// =============================================================================

export const createTestDate = (offset = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

export const createFutureDate = (daysInFuture = 7): Date => createTestDate(daysInFuture);

export const createPastDate = (daysInPast = 7): Date => createTestDate(-daysInPast);

// =============================================================================
// 一括データ作成ヘルパー
// =============================================================================

export interface TestScenarioData {
  user: TestUserData;
  tasks: TestTaskData[];
  tags: TestTagData[];
}

export const createTestScenario = (
  overrides: {
    taskCount?: number;
    tagCount?: number;
    user?: Partial<TestUserData>;
  } = {},
): TestScenarioData => {
  const { taskCount = 3, tagCount = 2, user: userOverrides = {} } = overrides;

  const user = createTestUserData(userOverrides);
  const tasks = createTestTasksData(taskCount, user.id);
  const tags = createTestTagsData(tagCount, user.id);

  return { user, tasks, tags };
};

// =============================================================================
// 定数・設定値
// =============================================================================

export const TEST_CONSTANTS = {
  // パスワード
  VALID_PASSWORD: 'TestPassword123!',
  WEAK_PASSWORD: 'password',
  SHORT_PASSWORD: '123',

  // メール
  VALID_EMAIL: 'test@example.com',
  INVALID_EMAIL: 'invalid-email',

  // 色
  VALID_COLOR: '#3B82F6',
  INVALID_COLOR: 'blue',

  // 日付
  FUTURE_DATE: createFutureDate(),
  PAST_DATE: createPastDate(),

  // 位置
  VALID_POSITION: 10,
  INVALID_POSITION: -1,
} as const;
