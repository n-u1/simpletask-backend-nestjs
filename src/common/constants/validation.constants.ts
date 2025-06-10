import { TagConstants, TaskConstants, UserConstants } from './app.constants';

/**
 * バリデーション関連の定数
 * class-validatorで使用する制約値とメッセージを管理
 */

// =============================================================================
// 正規表現パターン
// =============================================================================

export class ValidationPatterns {
  // メールアドレス（RFC 5322準拠の簡易版）
  static readonly EMAIL =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // パスワード強度（英数字含む8文字以上）
  static readonly PASSWORD_STRONG = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  // 表示名（日本語、英数字、一部記号）
  static readonly DISPLAY_NAME = UserConstants.DISPLAY_NAME_PATTERN;

  // カラーコード（#RRGGBB形式）
  static readonly COLOR_CODE = TagConstants.COLOR_PATTERN;

  // UUID v4形式
  static readonly UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // タスクタイトル（空白文字のみは不可）
  static readonly TASK_TITLE = /^(?!\s*$).+/;

  // タグ名（空白文字のみは不可）
  static readonly TAG_NAME = /^(?!\s*$).+/;

  // URL形式（HTTP/HTTPS）
  static readonly HTTP_URL =
    /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/;
}

// =============================================================================
// class-validator用制約値
// =============================================================================

export class ValidationLimits {
  // 文字列長制限
  static readonly EMAIL_MAX_LENGTH = UserConstants.EMAIL_MAX_LENGTH;
  static readonly PASSWORD_MIN_LENGTH = UserConstants.PASSWORD_MIN_LENGTH;
  static readonly PASSWORD_MAX_LENGTH = UserConstants.PASSWORD_MAX_LENGTH;
  static readonly DISPLAY_NAME_MIN_LENGTH = UserConstants.DISPLAY_NAME_MIN_LENGTH;
  static readonly DISPLAY_NAME_MAX_LENGTH = UserConstants.DISPLAY_NAME_MAX_LENGTH;
  static readonly TASK_TITLE_MIN_LENGTH = TaskConstants.TITLE_MIN_LENGTH;
  static readonly TASK_TITLE_MAX_LENGTH = TaskConstants.TITLE_MAX_LENGTH;
  static readonly TASK_DESCRIPTION_MAX_LENGTH = TaskConstants.DESCRIPTION_MAX_LENGTH;
  static readonly TAG_NAME_MIN_LENGTH = TagConstants.NAME_MIN_LENGTH;
  static readonly TAG_NAME_MAX_LENGTH = TagConstants.NAME_MAX_LENGTH;
  static readonly TAG_DESCRIPTION_MAX_LENGTH = TagConstants.DESCRIPTION_MAX_LENGTH;
  static readonly AVATAR_URL_MAX_LENGTH = UserConstants.AVATAR_URL_MAX_LENGTH;

  // 数値制限
  static readonly TASK_POSITION_MIN = TaskConstants.POSITION_MIN;
  static readonly TASK_POSITION_MAX = TaskConstants.POSITION_MAX;

  // 配列制限
  static readonly TAG_IDS_MAX_COUNT = 10; // 1タスクに付けられるタグの最大数
  static readonly BULK_OPERATION_MAX = 100; // 一括操作の最大件数

  // ファイル制限
  static readonly FILE_SIZE_MAX = 10 * 1024 * 1024; // 10MB
  static readonly AVATAR_FILE_SIZE_MAX = 2 * 1024 * 1024; // 2MB

  // 日時制限
  static readonly DUE_DATE_MAX_FUTURE_YEARS = 10; // 期限日の最大未来年数
}

// =============================================================================
// class-validator用バリデーションメッセージ
// =============================================================================

export class ValidationMessages {
  // 共通メッセージ（class-validator用）
  static readonly IS_NOT_EMPTY = '$property は必須項目です';
  static readonly IS_STRING = '$property は文字列である必要があります';
  static readonly IS_NUMBER = '$property は数値である必要があります';
  static readonly IS_BOOLEAN = '$property は真偽値である必要があります';
  static readonly IS_UUID = '$property は有効なUUIDである必要があります';
  static readonly IS_EMAIL = '$property は有効なメールアドレスである必要があります';
  static readonly IS_URL = '$property は有効なURLである必要があります';
  static readonly IS_DATE = '$property は有効な日時である必要があります';

  // 長さ制限メッセージ
  static readonly MIN_LENGTH = '$property は $constraint1 文字以上で入力してください';
  static readonly MAX_LENGTH = '$property は $constraint1 文字以内で入力してください';
  static readonly LENGTH = '$property は $constraint1 文字から $constraint2 文字の間で入力してください';

  // 数値範囲メッセージ
  static readonly MIN = '$property は $constraint1 以上である必要があります';
  static readonly MAX = '$property は $constraint1 以下である必要があります';
  static readonly IS_POSITIVE = '$property は正の数である必要があります';
  static readonly IS_INT = '$property は整数である必要があります';

  // 配列メッセージ
  static readonly ARRAY_MIN_SIZE = '$property は $constraint1 個以上選択してください';
  static readonly ARRAY_MAX_SIZE = '$property は $constraint1 個以下で選択してください';
  static readonly ARRAY_NOT_EMPTY = '$property は1つ以上選択してください';

  // 正規表現メッセージ
  static readonly MATCHES = '$property の形式が正しくありません';

  // 列挙型メッセージ
  static readonly IS_ENUM = '$property は有効な値を選択してください';

  // カスタムメッセージ
  static readonly PASSWORD_WEAK = 'パスワードには英字と数字を含めてください';
  static readonly COLOR_CODE_INVALID = 'カラーコードは #RRGGBB 形式で入力してください';
  static readonly DISPLAY_NAME_INVALID_CHARS = '表示名に使用できない文字が含まれています';
  static readonly DATE_IN_FUTURE = '日時は現在より未来の時刻を指定してください';
  static readonly DATE_TOO_FAR = '日時が未来すぎます';
  static readonly FILE_TOO_LARGE = 'ファイルサイズが制限を超えています';
  static readonly INVALID_IMAGE_TYPE = '有効な画像ファイルを選択してください';
}

// =============================================================================
// カスタムバリデーター用ヘルパー
// =============================================================================

export class ValidationHelpers {
  /**
   * 弱いパスワードかどうかチェック
   */
  static isWeakPassword(password: string): boolean {
    return (UserConstants.WEAK_PASSWORDS as readonly string[]).includes(password.toLowerCase());
  }

  /**
   * 画像URLかどうかチェック
   */
  static isImageUrl(url: string): boolean {
    return UserConstants.ALLOWED_IMAGE_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * 期限日が妥当な範囲かチェック
   */
  static isValidDueDate(date: Date): boolean {
    const now = new Date();
    const maxFuture = new Date();
    maxFuture.setFullYear(now.getFullYear() + ValidationLimits.DUE_DATE_MAX_FUTURE_YEARS);

    return date >= now && date <= maxFuture;
  }

  /**
   * UUID v4形式かチェック
   */
  static isUuidV4(value: string): boolean {
    return ValidationPatterns.UUID_V4.test(value);
  }

  /**
   * カラーコードの妥当性チェック
   */
  static isValidColorCode(color: string): boolean {
    return ValidationPatterns.COLOR_CODE.test(color);
  }

  /**
   * パスワード強度チェック
   */
  static isStrongPassword(password: string): boolean {
    return ValidationPatterns.PASSWORD_STRONG.test(password);
  }

  /**
   * ファイルサイズチェック
   */
  static isValidFileSize(fileSize: number, maxSize: number = ValidationLimits.FILE_SIZE_MAX): boolean {
    return fileSize <= maxSize;
  }

  /**
   * 画像ファイル拡張子チェック
   */
  static isValidImageExtension(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return (UserConstants.ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
  }
}

// =============================================================================
// DTOバリデーション用デコレータオプション
// =============================================================================

export class ValidationOptions {
  // メール用
  static readonly EMAIL = {
    pattern: ValidationPatterns.EMAIL,
    maxLength: ValidationLimits.EMAIL_MAX_LENGTH,
    message: ValidationMessages.IS_EMAIL,
  };

  // パスワード用
  static readonly PASSWORD = {
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
    pattern: ValidationPatterns.PASSWORD_STRONG,
  };

  // 表示名用
  static readonly DISPLAY_NAME = {
    minLength: ValidationLimits.DISPLAY_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.DISPLAY_NAME_MAX_LENGTH,
    pattern: ValidationPatterns.DISPLAY_NAME,
  };

  // タスクタイトル用
  static readonly TASK_TITLE = {
    minLength: ValidationLimits.TASK_TITLE_MIN_LENGTH,
    maxLength: ValidationLimits.TASK_TITLE_MAX_LENGTH,
    pattern: ValidationPatterns.TASK_TITLE,
  };

  // タグ名用
  static readonly TAG_NAME = {
    minLength: ValidationLimits.TAG_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.TAG_NAME_MAX_LENGTH,
    pattern: ValidationPatterns.TAG_NAME,
  };

  // カラーコード用
  static readonly COLOR_CODE = {
    pattern: ValidationPatterns.COLOR_CODE,
    message: ValidationMessages.COLOR_CODE_INVALID,
  };

  // UUID用
  static readonly UUID = {
    pattern: ValidationPatterns.UUID_V4,
    message: ValidationMessages.IS_UUID,
  };
}
