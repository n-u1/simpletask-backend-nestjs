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
  static readonly EMAIL_TOO_LONG = 'メールアドレスは255文字以内で入力してください';

  // パスワード関連
  static readonly PASSWORD_REQUIRED = 'パスワードは必須です';
  static readonly PASSWORD_TOO_SHORT = 'パスワードは8文字以上で入力してください';
  static readonly PASSWORD_TOO_LONG = 'パスワードは128文字以内で入力してください';
  static readonly PASSWORD_WEAK = 'パスワードには英字と数字を含めてください';
  static readonly PASSWORD_MISMATCH = 'パスワードが一致しません';

  // 表示名関連
  static readonly DISPLAY_NAME_REQUIRED = '表示名は必須です';
  static readonly DISPLAY_NAME_TOO_SHORT = '表示名は2文字以上で入力してください';
  static readonly DISPLAY_NAME_TOO_LONG = '表示名は20文字以内で入力してください';
  static readonly DISPLAY_NAME_INVALID = '表示名に使用できない文字が含まれています';

  // UUID関連
  static readonly UUID_INVALID = '有効なUUIDを入力してください';
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
  static readonly TASK_TITLE_REQUIRED = 'タスクタイトルは必須です';
  static readonly TASK_TITLE_TOO_LONG = 'タスクタイトルは20文字以内で入力してください';
  static readonly TASK_DESCRIPTION_TOO_LONG = 'タスク説明は2000文字以内で入力してください';
  static readonly TASK_STATUS_INVALID = '無効なステータスです';
  static readonly TASK_PRIORITY_INVALID = '無効な優先度です';

  // タグ関連
  static readonly TAG_NOT_FOUND = 'タグが見つかりません';
  static readonly TAG_ACCESS_DENIED = 'このタグにアクセスする権限がありません';
  static readonly TAG_NAME_REQUIRED = 'タグ名は必須です';
  static readonly TAG_NAME_TOO_LONG = 'タグ名は20文字以内で入力してください';
  static readonly TAG_NAME_DUPLICATE = 'このタグ名は既に使用されています';
  static readonly TAG_COLOR_INVALID = '有効なカラーコード（#RRGGBB形式）を入力してください';
  static readonly TAG_DESCRIPTION_TOO_LONG = 'タグ説明は200文字以内で入力してください';
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
// ファイル関連エラー
// =============================================================================

export class FileErrorMessages {
  static readonly FILE_NOT_FOUND = 'ファイルが見つかりません';
  static readonly FILE_TOO_LARGE = 'ファイルサイズが大きすぎます';
  static readonly FILE_TYPE_NOT_SUPPORTED = 'サポートされていないファイル形式です';
  static readonly FILE_UPLOAD_FAILED = 'ファイルのアップロードに失敗しました';
  static readonly IMAGE_INVALID = '有効な画像ファイルではありません';
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
  static readonly VALIDATION_ERROR = '入力値に誤りがあります';
  static readonly PASSWORD_TOO_SHORT = ValidationErrorMessages.PASSWORD_TOO_SHORT;
  static readonly PASSWORD_TOO_LONG = ValidationErrorMessages.PASSWORD_TOO_LONG;
  static readonly PASSWORD_TOO_WEAK = 'このパスワードは簡単すぎるため使用できません';
  static readonly DISPLAY_NAME_TOO_SHORT = ValidationErrorMessages.DISPLAY_NAME_TOO_SHORT;
  static readonly DISPLAY_NAME_TOO_LONG = ValidationErrorMessages.DISPLAY_NAME_TOO_LONG;
  static readonly DISPLAY_NAME_INVALID_CHARS = ValidationErrorMessages.DISPLAY_NAME_INVALID;

  // リソース関連
  static readonly TASK_NOT_FOUND = ResourceErrorMessages.TASK_NOT_FOUND;
  static readonly TASK_TITLE_REQUIRED = ResourceErrorMessages.TASK_TITLE_REQUIRED;
  static readonly TASK_TITLE_TOO_LONG = ResourceErrorMessages.TASK_TITLE_TOO_LONG;
  static readonly TASK_ACCESS_DENIED = ResourceErrorMessages.TASK_ACCESS_DENIED;
  static readonly TAG_NOT_FOUND = ResourceErrorMessages.TAG_NOT_FOUND;
  static readonly TAG_NAME_REQUIRED = ResourceErrorMessages.TAG_NAME_REQUIRED;
  static readonly TAG_NAME_TOO_LONG = ResourceErrorMessages.TAG_NAME_TOO_LONG;
  static readonly TAG_NAME_DUPLICATE = ResourceErrorMessages.TAG_NAME_DUPLICATE;
  static readonly TAG_COLOR_INVALID = ResourceErrorMessages.TAG_COLOR_INVALID;
  static readonly TAG_ACCESS_DENIED = ResourceErrorMessages.TAG_ACCESS_DENIED;

  // システム関連
  static readonly SERVER_ERROR = SystemErrorMessages.SERVER_ERROR;
  static readonly NOT_FOUND = GeneralErrorMessages.NOT_FOUND;
  static readonly RATE_LIMIT_EXCEEDED = SystemErrorMessages.RATE_LIMIT_EXCEEDED;
}
