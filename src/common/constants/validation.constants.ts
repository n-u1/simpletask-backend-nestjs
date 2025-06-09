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
  static readonly DISPLAY_NAME = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龠\s\-_.]+$/;

  // カラーコード（#RRGGBB形式）
  static readonly COLOR_CODE = /^#[0-9A-Fa-f]{6}$/;

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
// バリデーションメッセージ
// =============================================================================

export class ValidationMessages {
  // 共通メッセージ
  static readonly REQUIRED = '必須項目です';
  static readonly INVALID_FORMAT = '形式が正しくありません';
  static readonly TOO_SHORT = '短すぎます';
  static readonly TOO_LONG = '長すぎます';
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

  // タスク関連
  static readonly TASK_TITLE_REQUIRED = 'タスクタイトルは必須です';
  static readonly TASK_TITLE_TOO_LONG = 'タスクタイトルは20文字以内で入力してください';
  static readonly TASK_DESCRIPTION_TOO_LONG = 'タスク説明は2000文字以内で入力してください';
  static readonly TASK_STATUS_INVALID = '無効なステータスです';
  static readonly TASK_PRIORITY_INVALID = '無効な優先度です';
  static readonly TASK_POSITION_INVALID = '位置は0以上99999以下で入力してください';
  static readonly TASK_DUE_DATE_INVALID = '有効な日時を入力してください';

  // タグ関連
  static readonly TAG_NAME_REQUIRED = 'タグ名は必須です';
  static readonly TAG_NAME_TOO_LONG = 'タグ名は20文字以内で入力してください';
  static readonly TAG_COLOR_INVALID = '有効なカラーコード（#RRGGBB形式）を入力してください';
  static readonly TAG_DESCRIPTION_TOO_LONG = 'タグ説明は200文字以内で入力してください';

  // URL関連
  static readonly AVATAR_URL_INVALID = '有効なURLを入力してください';
  static readonly AVATAR_URL_TOO_LONG = 'URLは500文字以内で入力してください';

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

  // ファイル関連
  static readonly FILE_REQUIRED = 'ファイルは必須です';
  static readonly FILE_TOO_LARGE = 'ファイルサイズが大きすぎます';
  static readonly FILE_INVALID_TYPE = 'サポートされていないファイル形式です';
}

// =============================================================================
// バリデーション制約値
// =============================================================================

export class ValidationLimits {
  // 文字列長制限
  static readonly EMAIL_MAX_LENGTH = 255;
  static readonly PASSWORD_MIN_LENGTH = 8;
  static readonly PASSWORD_MAX_LENGTH = 128;
  static readonly DISPLAY_NAME_MIN_LENGTH = 2;
  static readonly DISPLAY_NAME_MAX_LENGTH = 20;
  static readonly TASK_TITLE_MAX_LENGTH = 20;
  static readonly TASK_DESCRIPTION_MAX_LENGTH = 2000;
  static readonly TAG_NAME_MAX_LENGTH = 20;
  static readonly TAG_DESCRIPTION_MAX_LENGTH = 200;
  static readonly AVATAR_URL_MAX_LENGTH = 500;

  // 数値制限
  static readonly TASK_POSITION_MIN = 0;
  static readonly TASK_POSITION_MAX = 99999;
  static readonly PAGE_SIZE_MIN = 1;
  static readonly PAGE_SIZE_MAX = 100;
  static readonly PAGE_SIZE_DEFAULT = 20;

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
// カスタムバリデーター用ヘルパー
// =============================================================================

export class ValidationHelpers {
  /**
   * 弱いパスワードかどうかチェック
   */
  static isWeakPassword(password: string): boolean {
    const weakPasswords = [
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
    return weakPasswords.includes(password.toLowerCase());
  }

  /**
   * 画像URLかどうかチェック
   */
  static isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
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
}
