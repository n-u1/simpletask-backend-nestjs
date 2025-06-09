// =============================================================================
// 認証・ユーザー関連定数
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
  ];

  // 表示名に使用可能な文字パターン
  static readonly DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\s\-_.]+$/;

  // 画像ファイル拡張子
  static readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
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
  static readonly DEFAULT_STATUS = 'todo';
  static readonly DEFAULT_PRIORITY = 'medium';
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
  ];
}

// =============================================================================
// API関連定数
// =============================================================================

export class APIConstants {
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

  static readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  // タスク用ソート可能フィールド
  static readonly TASK_SORTABLE_FIELDS = [
    'created_at',
    'updated_at',
    'title',
    'status',
    'priority',
    'due_date',
    'position',
  ];

  // タグ用ソート可能フィールド
  static readonly TAG_SORTABLE_FIELDS = ['created_at', 'updated_at', 'name'];
}

// =============================================================================
// エラーメッセージ定数（FastAPI版を流用）
// =============================================================================

export class ErrorMessages {
  // 認証関連
  static readonly INVALID_CREDENTIALS = 'メールアドレスまたはパスワードが正しくありません';
  static readonly USER_NOT_FOUND = 'ユーザーが見つかりません';
  static readonly USER_INACTIVE = 'アカウントが無効化されています';
  static readonly EMAIL_ALREADY_EXISTS = 'このメールアドレスは既に登録されています';

  // パスワード関連
  static readonly PASSWORD_TOO_SHORT = `パスワードは${UserConstants.PASSWORD_MIN_LENGTH}文字以上である必要があります`;
  static readonly PASSWORD_TOO_LONG = `パスワードは${UserConstants.PASSWORD_MAX_LENGTH}文字以内で入力してください`;
  static readonly PASSWORD_NO_LETTERS = 'パスワードには英字を含めてください';
  static readonly PASSWORD_NO_NUMBERS = 'パスワードには数字を含めてください';
  static readonly PASSWORD_TOO_WEAK = 'このパスワードは簡単すぎるため使用できません';

  // 表示名関連
  static readonly DISPLAY_NAME_TOO_SHORT = `表示名は${UserConstants.DISPLAY_NAME_MIN_LENGTH}文字以上で入力してください`;
  static readonly DISPLAY_NAME_TOO_LONG = `表示名は${UserConstants.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`;
  static readonly DISPLAY_NAME_INVALID_CHARS = '表示名に使用できない文字が含まれています';

  // タスク関連
  static readonly TASK_NOT_FOUND = 'タスクが見つかりません';
  static readonly TASK_TITLE_REQUIRED = 'タスクタイトルは必須です';
  static readonly TASK_TITLE_TOO_LONG = `タスクタイトルは${TaskConstants.TITLE_MAX_LENGTH}文字以内で入力してください`;
  static readonly TASK_ACCESS_DENIED = 'このタスクにアクセスする権限がありません';

  // タグ関連
  static readonly TAG_NOT_FOUND = 'タグが見つかりません';
  static readonly TAG_NAME_REQUIRED = 'タグ名は必須です';
  static readonly TAG_NAME_TOO_LONG = `タグ名は${TagConstants.NAME_MAX_LENGTH}文字以内で入力してください`;
  static readonly TAG_NAME_DUPLICATE = 'このタグ名は既に使用されています';
  static readonly TAG_COLOR_INVALID = '有効なカラーコード（#RRGGBB形式）を入力してください';
  static readonly TAG_ACCESS_DENIED = 'このタグにアクセスする権限がありません';

  // 一般的なエラー
  static readonly VALIDATION_ERROR = '入力値に誤りがあります';
  static readonly SERVER_ERROR = 'サーバーエラーが発生しました';
  static readonly NOT_FOUND = 'リソースが見つかりません';
  static readonly UNAUTHORIZED = '認証が必要です';
  static readonly FORBIDDEN = 'アクセスが拒否されました';
  static readonly RATE_LIMIT_EXCEEDED = 'リクエスト制限を超過しました';
}

// =============================================================================
// 成功メッセージ定数（FastAPI版を流用）
// =============================================================================

export class SuccessMessages {
  // 認証関連
  static readonly USER_CREATED = 'ユーザーが正常に作成されました';
  static readonly LOGIN_SUCCESS = 'ログインしました';
  static readonly LOGOUT_SUCCESS = 'ログアウトしました';
  static readonly PASSWORD_CHANGED = 'パスワードが変更されました';

  // タスク関連
  static readonly TASK_CREATED = 'タスクが作成されました';
  static readonly TASK_UPDATED = 'タスクが更新されました';
  static readonly TASK_DELETED = 'タスクが削除されました';
  static readonly TASK_STATUS_UPDATED = 'タスクのステータスが更新されました';

  // タグ関連
  static readonly TAG_CREATED = 'タグが作成されました';
  static readonly TAG_UPDATED = 'タグが更新されました';
  static readonly TAG_DELETED = 'タグが削除されました';
}

// =============================================================================
// ヘルパー関数（FastAPI版を流用）
// =============================================================================

export function validateColorCode(color: string): boolean {
  return TagConstants.COLOR_PATTERN.test(color);
}

export function validateDisplayName(name: string): boolean {
  if (!name || name.trim().length < UserConstants.DISPLAY_NAME_MIN_LENGTH) {
    return false;
  }

  if (name.trim().length > UserConstants.DISPLAY_NAME_MAX_LENGTH) {
    return false;
  }

  return UserConstants.DISPLAY_NAME_PATTERN.test(name.trim());
}

export function isWeakPassword(password: string): boolean {
  return UserConstants.WEAK_PASSWORDS.includes(password.toLowerCase());
}
