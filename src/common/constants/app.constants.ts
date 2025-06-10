/**
 * アプリケーション基本定数
 * ドメイン設定・制約値・列挙型・ヘルパー関数を統一管理
 */

// =============================================================================
// アプリケーション基本設定
// =============================================================================

export class AppConstants {
  // API設定
  static readonly API_VERSION = 'v1';
  static readonly API_PREFIX = 'api/v1';

  // ページネーション設定
  static readonly DEFAULT_PAGE_SIZE = 20;
  static readonly MAX_PAGE_SIZE = 100;
  static readonly MIN_PAGE_SIZE = 1;

  // 検索・フィルタリング設定
  static readonly SEARCH_MIN_LENGTH = 1;
  static readonly SEARCH_MAX_LENGTH = 100;

  // ソート設定
  static readonly DEFAULT_SORT_FIELD = 'created_at';
  static readonly DEFAULT_SORT_ORDER = 'desc';
  static readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

  // タスク用ソート可能フィールド
  static readonly TASK_SORTABLE_FIELDS = [
    'created_at',
    'updated_at',
    'title',
    'status',
    'priority',
    'due_date',
    'position',
  ] as const;

  // タグ用ソート可能フィールド
  static readonly TAG_SORTABLE_FIELDS = ['created_at', 'updated_at', 'name'] as const;
}

// =============================================================================
// ユーザー関連定数
// =============================================================================

export class UserConstants {
  // パスワード設定
  static readonly PASSWORD_MIN_LENGTH = 8;
  static readonly PASSWORD_MAX_LENGTH = 128;

  // 表示名設定
  static readonly DISPLAY_NAME_MIN_LENGTH = 2;
  static readonly DISPLAY_NAME_MAX_LENGTH = 20;

  // メール設定
  static readonly EMAIL_MAX_LENGTH = 255;

  // アバター設定
  static readonly AVATAR_URL_MAX_LENGTH = 500;

  // パスワード強度チェック
  static readonly WEAK_PASSWORDS = [
    'password',
    '12345678',
    'qwerty',
    'admin',
    'user',
    'test',
    '123456789',
    'password123',
    'admin123',
  ] as const;

  // 表示名に使用可能な文字パターン
  static readonly DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\s\-_.]+$/;

  // 画像ファイル拡張子
  static readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
}

// =============================================================================
// タスク関連定数
// =============================================================================

export class TaskConstants {
  // タスクタイトル設定
  static readonly TITLE_MIN_LENGTH = 1;
  static readonly TITLE_MAX_LENGTH = 20;

  // タスク説明設定
  static readonly DESCRIPTION_MAX_LENGTH = 2000;

  // 位置情報設定
  static readonly POSITION_MIN = 0;
  static readonly POSITION_MAX = 99999;

  // デフォルト値
  static readonly DEFAULT_POSITION = 0;
  static readonly DEFAULT_STATUS = 'todo' as const;
  static readonly DEFAULT_PRIORITY = 'medium' as const;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// =============================================================================
// タグ関連定数
// =============================================================================

export class TagConstants {
  // タグ名設定
  static readonly NAME_MIN_LENGTH = 1;
  static readonly NAME_MAX_LENGTH = 20;

  // タグ説明設定
  static readonly DESCRIPTION_MAX_LENGTH = 200;

  // カラーコード設定
  static readonly COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
  static readonly DEFAULT_COLOR = '#3B82F6';

  // 使用可能なプリセットカラー
  static readonly PRESET_COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ] as const;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

export function validateColorCode(color: string): boolean {
  return TagConstants.COLOR_PATTERN.test(color);
}

export function validateDisplayName(name: string): boolean {
  if (!name?.trim()) {
    return false;
  }

  const trimmed = name.trim();

  if (trimmed.length < UserConstants.DISPLAY_NAME_MIN_LENGTH) {
    return false;
  }

  if (trimmed.length > UserConstants.DISPLAY_NAME_MAX_LENGTH) {
    return false;
  }

  return UserConstants.DISPLAY_NAME_PATTERN.test(trimmed);
}

export function isWeakPassword(password: string): boolean {
  return (UserConstants.WEAK_PASSWORDS as readonly string[]).includes(password.toLowerCase());
}

export function isValidImageExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return (UserConstants.ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
}
