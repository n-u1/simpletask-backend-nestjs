import { TagConstants, TaskConstants, UserConstants } from './app.constants';

/**
 * エラーメッセージ定数
 * アプリケーション全体で使用するエラーメッセージを統一管理
 */

// =============================================================================
// 認証・セキュリティ関連エラー
// =============================================================================

export class AuthErrorMessages {
  static readonly INVALID_CREDENTIALS = 'メールアドレスまたはパスワードが正しくありません';
  static readonly USER_NOT_FOUND = 'ユーザーが見つかりません';
  static readonly USER_INACTIVE = 'アカウントが無効化されています';
  static readonly USER_LOCKED = 'アカウントがロックされています。しばらく時間をおいて再度お試しください';
  static readonly EMAIL_ALREADY_EXISTS = 'このメールアドレスは既に登録されています';
  static readonly EMAIL_NOT_VERIFIED = 'メールアドレスが認証されていません';
  static readonly TOKEN_EXPIRED = 'トークンの有効期限が切れています';
  static readonly TOKEN_INVALID = '無効なトークンです';
  static readonly UNAUTHORIZED = '認証が必要です';
  static readonly FORBIDDEN = 'アクセスが拒否されました';
  static readonly SESSION_EXPIRED = 'セッションの有効期限が切れています';
}

// =============================================================================
// バリデーション関連エラー
// =============================================================================

export class ValidationErrorMessages {
  // 共通メッセージ
  static readonly REQUIRED = '必須項目です';
  static readonly INVALID_FORMAT = '形式が正しくありません';
  static readonly INVALID_TYPE = '型が正しくありません';
  static readonly OUT_OF_RANGE = '範囲外の値です';

  // メール関連
  static readonly EMAIL_REQUIRED = 'メールアドレスは必須です';
  static readonly EMAIL_INVALID = '有効なメールアドレスを入力してください';
  static readonly EMAIL_TOO_LONG = `メールアドレスは${UserConstants.EMAIL_MAX_LENGTH}文字以内で入力してください`;

  // パスワード関連
  static readonly PASSWORD_REQUIRED = 'パスワードは必須です';
  static readonly PASSWORD_TOO_SHORT = `パスワードは${UserConstants.PASSWORD_MIN_LENGTH}文字以上で入力してください`;
  static readonly PASSWORD_TOO_LONG = `パスワードは${UserConstants.PASSWORD_MAX_LENGTH}文字以内で入力してください`;
  static readonly PASSWORD_WEAK = 'パスワードには英字と数字を含めてください';
  static readonly PASSWORD_TOO_WEAK = 'このパスワードは簡単すぎるため使用できません';
  static readonly PASSWORD_NO_LETTERS = 'パスワードには英字を含めてください';
  static readonly PASSWORD_NO_NUMBERS = 'パスワードには数字を含めてください';
  static readonly PASSWORD_MISMATCH = 'パスワードが一致しません';

  // 表示名関連
  static readonly DISPLAY_NAME_REQUIRED = '表示名は必須です';
  static readonly DISPLAY_NAME_TOO_SHORT = `表示名は${UserConstants.DISPLAY_NAME_MIN_LENGTH}文字以上で入力してください`;
  static readonly DISPLAY_NAME_TOO_LONG = `表示名は${UserConstants.DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`;
  static readonly DISPLAY_NAME_INVALID = '表示名に使用できない文字が含まれています';

  // タスク関連
  static readonly TASK_TITLE_REQUIRED = 'タスクタイトルは必須です';
  static readonly TASK_TITLE_TOO_LONG = `タスクタイトルは${TaskConstants.TITLE_MAX_LENGTH}文字以内で入力してください`;
  static readonly TASK_DESCRIPTION_TOO_LONG = `タスク説明は${TaskConstants.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`;
  static readonly TASK_STATUS_INVALID = '無効なステータスです';
  static readonly TASK_PRIORITY_INVALID = '無効な優先度です';
  static readonly TASK_POSITION_INVALID = `位置は${TaskConstants.POSITION_MIN}以上${TaskConstants.POSITION_MAX}以下で入力してください`;
  static readonly TASK_DUE_DATE_INVALID = '有効な日時を入力してください';
  static readonly TASK_ID_REQUIRED = 'タスクIDは必須です';

  // タグ関連
  static readonly TAG_NAME_REQUIRED = 'タグ名は必須です';
  static readonly TAG_NAME_TOO_LONG = `タグ名は${TagConstants.NAME_MAX_LENGTH}文字以内で入力してください`;
  static readonly TAG_COLOR_INVALID = '有効なカラーコード（#RRGGBB形式）を入力してください';
  static readonly TAG_DESCRIPTION_TOO_LONG = `タグ説明は${TagConstants.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`;
  static readonly TAG_ID_REQUIRED = 'タグIDは必須です';

  // タスク・タグ関連付け
  static readonly TASK_TAG_IDS_SAME = 'タスクIDとタグIDを同じにすることはできません';
  static readonly TASK_TAG_ASSOCIATION_INVALID = '無効なタスク・タグの関連付けです';
  static readonly TASK_TAG_ALREADY_EXISTS = 'このタスクとタグの関連付けは既に存在します';
  static readonly TASK_TAG_NOT_FOUND = 'タスクとタグの関連付けが見つかりません';

  // UUID関連
  static readonly UUID_INVALID = '有効なUUIDを入力してください';

  // 日時関連
  static readonly DATE_INVALID = '有効な日時を入力してください';
  static readonly DATE_IN_PAST = '過去の日時は指定できません';
  static readonly DATE_TOO_FAR = '日時が未来すぎます';

  // 数値関連
  static readonly NUMBER_INVALID = '有効な数値を入力してください';
  static readonly NUMBER_TOO_SMALL = '値が小さすぎます';
  static readonly NUMBER_TOO_LARGE = '値が大きすぎます';
  static readonly INTEGER_INVALID = '整数を入力してください';

  // 配列関連
  static readonly ARRAY_EMPTY = '1つ以上選択してください';
  static readonly ARRAY_TOO_MANY = '選択数が多すぎます';

  // URL関連
  static readonly AVATAR_URL_INVALID = '有効なURLを入力してください';
  static readonly AVATAR_URL_TOO_LONG = `URLは${UserConstants.AVATAR_URL_MAX_LENGTH}文字以内で入力してください`;

  // ファイル関連
  static readonly FILE_REQUIRED = 'ファイルは必須です';
  static readonly FILE_TOO_LARGE = 'ファイルサイズが大きすぎます';
  static readonly FILE_INVALID_TYPE = 'サポートされていないファイル形式です';
}

// =============================================================================
// リソース関連エラー
// =============================================================================

export class ResourceErrorMessages {
  // ユーザー関連
  static readonly USER_NOT_FOUND = 'ユーザーが見つかりません';
  static readonly USER_ACCESS_DENIED = 'このユーザーにアクセスする権限がありません';

  // タスク関連
  static readonly TASK_NOT_FOUND = 'タスクが見つかりません';
  static readonly TASK_ACCESS_DENIED = 'このタスクにアクセスする権限がありません';

  // タグ関連
  static readonly TAG_NOT_FOUND = 'タグが見つかりません';
  static readonly TAG_ACCESS_DENIED = 'このタグにアクセスする権限がありません';
  static readonly TAG_NAME_DUPLICATE = 'このタグ名は既に使用されています';
}

// =============================================================================
// システム関連エラー
// =============================================================================

export class SystemErrorMessages {
  static readonly SERVER_ERROR = 'サーバーエラーが発生しました';
  static readonly DATABASE_ERROR = 'データベースエラーが発生しました';
  static readonly NETWORK_ERROR = 'ネットワークエラーが発生しました';
  static readonly SERVICE_UNAVAILABLE = 'サービスが一時的に利用できません';
  static readonly MAINTENANCE_MODE = 'システムメンテナンス中です';
  static readonly RATE_LIMIT_EXCEEDED = 'リクエスト制限を超過しました';
  static readonly REQUEST_TOO_LARGE = 'リクエストサイズが大きすぎます';
  static readonly TIMEOUT = 'リクエストがタイムアウトしました';
}

// =============================================================================
// エンティティバリデーション関連エラー
// =============================================================================

export class EntityErrorMessages {
  // BaseEntity用
  static readonly ENTITY_ID_REQUIRED = '登録済みエンティティにはIDが必要です';
  static readonly ENTITY_CREATED_AT_REQUIRED = '登録済みエンティティには作成日時が必要です';
  static readonly ENTITY_UPDATED_AT_REQUIRED = '登録済みエンティティには更新日時が必要です';

  // User固有
  static readonly USER_EMAIL_REQUIRED = 'メールアドレスは必須です';
  static readonly USER_DISPLAY_NAME_REQUIRED = '表示名は必須です';
  static readonly USER_LOGIN_ATTEMPTS_NEGATIVE = 'ログイン失敗回数は負の値にできません';
}

// =============================================================================
// 一般的なエラー
// =============================================================================

export class GeneralErrorMessages {
  static readonly NOT_FOUND = 'リソースが見つかりません';
  static readonly ALREADY_EXISTS = 'リソースが既に存在します';
  static readonly OPERATION_FAILED = '操作に失敗しました';
  static readonly INVALID_OPERATION = '無効な操作です';
  static readonly PERMISSION_DENIED = '権限がありません';
  static readonly QUOTA_EXCEEDED = '制限を超過しました';
  static readonly FEATURE_NOT_AVAILABLE = 'この機能は利用できません';
  static readonly TEMPORARILY_UNAVAILABLE = '一時的に利用できません';
  static readonly VALIDATION_ERROR = '入力値に誤りがあります';
}

// =============================================================================
// 統合エラーメッセージクラス
// =============================================================================

export class ErrorMessages {
  // 認証関連
  static readonly INVALID_CREDENTIALS = AuthErrorMessages.INVALID_CREDENTIALS;
  static readonly USER_NOT_FOUND = AuthErrorMessages.USER_NOT_FOUND;
  static readonly USER_INACTIVE = AuthErrorMessages.USER_INACTIVE;
  static readonly EMAIL_ALREADY_EXISTS = AuthErrorMessages.EMAIL_ALREADY_EXISTS;
  static readonly UNAUTHORIZED = AuthErrorMessages.UNAUTHORIZED;
  static readonly FORBIDDEN = AuthErrorMessages.FORBIDDEN;

  // バリデーション関連
  static readonly VALIDATION_ERROR = GeneralErrorMessages.VALIDATION_ERROR;
  static readonly PASSWORD_TOO_SHORT = ValidationErrorMessages.PASSWORD_TOO_SHORT;
  static readonly PASSWORD_TOO_LONG = ValidationErrorMessages.PASSWORD_TOO_LONG;
  static readonly PASSWORD_TOO_WEAK = ValidationErrorMessages.PASSWORD_TOO_WEAK;
  static readonly DISPLAY_NAME_TOO_SHORT = ValidationErrorMessages.DISPLAY_NAME_TOO_SHORT;
  static readonly DISPLAY_NAME_TOO_LONG = ValidationErrorMessages.DISPLAY_NAME_TOO_LONG;
  static readonly DISPLAY_NAME_INVALID_CHARS = ValidationErrorMessages.DISPLAY_NAME_INVALID;

  // リソース関連
  static readonly TASK_NOT_FOUND = ResourceErrorMessages.TASK_NOT_FOUND;
  static readonly TASK_TITLE_REQUIRED = ValidationErrorMessages.TASK_TITLE_REQUIRED;
  static readonly TASK_TITLE_TOO_LONG = ValidationErrorMessages.TASK_TITLE_TOO_LONG;
  static readonly TASK_ACCESS_DENIED = ResourceErrorMessages.TASK_ACCESS_DENIED;
  static readonly TAG_NOT_FOUND = ResourceErrorMessages.TAG_NOT_FOUND;
  static readonly TAG_NAME_REQUIRED = ValidationErrorMessages.TAG_NAME_REQUIRED;
  static readonly TAG_NAME_TOO_LONG = ValidationErrorMessages.TAG_NAME_TOO_LONG;
  static readonly TAG_NAME_DUPLICATE = ResourceErrorMessages.TAG_NAME_DUPLICATE;
  static readonly TAG_COLOR_INVALID = ValidationErrorMessages.TAG_COLOR_INVALID;
  static readonly TAG_ACCESS_DENIED = ResourceErrorMessages.TAG_ACCESS_DENIED;

  // エンティティ関連
  static readonly ENTITY_ID_REQUIRED = EntityErrorMessages.ENTITY_ID_REQUIRED;
  static readonly ENTITY_CREATED_AT_REQUIRED = EntityErrorMessages.ENTITY_CREATED_AT_REQUIRED;
  static readonly ENTITY_UPDATED_AT_REQUIRED = EntityErrorMessages.ENTITY_UPDATED_AT_REQUIRED;

  // システム関連
  static readonly SERVER_ERROR = SystemErrorMessages.SERVER_ERROR;
  static readonly NOT_FOUND = GeneralErrorMessages.NOT_FOUND;
  static readonly RATE_LIMIT_EXCEEDED = SystemErrorMessages.RATE_LIMIT_EXCEEDED;
}
