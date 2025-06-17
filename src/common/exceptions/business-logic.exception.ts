import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * ビジネスロジック例外
 * アプリケーション固有のビジネスルール違反を表す例外クラス
 * HTTPステータスコード400（Bad Request）で返される
 */
export class BusinessLogicException extends HttpException {
  /**
   * エラーコード（ログ・モニタリング用）
   */
  public readonly errorCode: string;

  /**
   * エラー詳細情報（デバッグ用）
   */
  public readonly details: Record<string, unknown>;

  /**
   * エラー発生時刻
   */
  public readonly timestamp: string;

  /**
   * エラー発生場所（クラス名・メソッド名）
   */
  public readonly context: string;

  constructor(message: string, errorCode: string, details: Record<string, unknown> = {}, context = 'Unknown') {
    // HTTPException の基底クラスを初期化
    super(
      {
        success: false,
        message,
        error: errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );

    this.name = 'BusinessLogicException';
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // スタックトレースを設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessLogicException);
    }
  }

  /**
   * ユーザー認証エラー
   */
  static invalidCredentials(email?: string, context = 'AuthService'): BusinessLogicException {
    return new BusinessLogicException(
      'メールアドレスまたはパスワードが正しくありません',
      'INVALID_CREDENTIALS',
      { email: email ? `${email.slice(0, 3)}***` : 'unknown' }, // セキュリティ: 一部マスキング
      context,
    );
  }

  /**
   * アカウントロック エラー
   */
  static accountLocked(lockedUntil: Date, context = 'AuthService'): BusinessLogicException {
    return new BusinessLogicException(
      'アカウントがロックされています。しばらく時間をおいて再度お試しください',
      'ACCOUNT_LOCKED',
      {
        lockedUntil: lockedUntil.toISOString(),
        unlockInMinutes: Math.ceil((lockedUntil.getTime() - Date.now()) / 60000),
      },
      context,
    );
  }

  /**
   * メールアドレス重複エラー
   */
  static emailAlreadyExists(email: string, context = 'UserService'): BusinessLogicException {
    return new BusinessLogicException(
      'このメールアドレスは既に登録されています',
      'EMAIL_ALREADY_EXISTS',
      { email: `${email.slice(0, 3)}***` }, // セキュリティ: 一部マスキング
      context,
    );
  }

  /**
   * パスワード強度不足エラー
   */
  static weakPassword(context = 'UserService'): BusinessLogicException {
    return new BusinessLogicException(
      'パスワードが弱すぎます。英字と数字を含む8文字以上で設定してください',
      'WEAK_PASSWORD',
      {
        requirements: ['8文字以上', '英字を含む', '数字を含む', '一般的なパスワードは使用不可'],
      },
      context,
    );
  }

  /**
   * タスクの状態遷移エラー
   */
  static invalidTaskStatusTransition(
    currentStatus: string,
    targetStatus: string,
    taskId: string,
    context = 'TaskService',
  ): BusinessLogicException {
    return new BusinessLogicException(
      `タスクの状態を '${currentStatus}' から '${targetStatus}' に変更することはできません`,
      'INVALID_STATUS_TRANSITION',
      {
        taskId,
        currentStatus,
        targetStatus,
        allowedTransitions: getValidStatusTransitions(currentStatus),
      },
      context,
    );
  }

  /**
   * タグ名重複エラー
   */
  static tagNameDuplicate(tagName: string, userId: string, context = 'TagService'): BusinessLogicException {
    return new BusinessLogicException(
      'このタグ名は既に使用されています',
      'TAG_NAME_DUPLICATE',
      {
        tagName,
        userId: `user_${userId.slice(-8)}`, // セキュリティ: 末尾8文字のみ
      },
      context,
    );
  }

  /**
   * タスクとタグの関連付けエラー
   */
  static taskTagAssociationFailed(
    taskId: string,
    tagId: string,
    reason: string,
    context = 'TaskTagService',
  ): BusinessLogicException {
    return new BusinessLogicException(
      'タスクとタグの関連付けに失敗しました',
      'TASK_TAG_ASSOCIATION_FAILED',
      {
        taskId,
        tagId,
        reason,
      },
      context,
    );
  }

  /**
   * リソース所有権エラー
   */
  static accessDenied(
    resourceType: string,
    resourceId: string,
    userId: string,
    context = 'OwnershipGuard',
  ): BusinessLogicException {
    return new BusinessLogicException(
      'このリソースにアクセスする権限がありません',
      'ACCESS_DENIED',
      {
        resourceType,
        resourceId,
        userId: `user_${userId.slice(-8)}`, // セキュリティ: 末尾8文字のみ
      },
      context,
    );
  }

  /**
   * バリデーションエラー（複数項目）
   */
  static validationFailed(
    errors: Array<{
      field: string;
      value: unknown;
      constraints: string[];
    }>,
    context = 'ValidationPipe',
  ): BusinessLogicException {
    return new BusinessLogicException(
      '入力値に誤りがあります',
      'VALIDATION_FAILED',
      {
        errors: errors.map(error => ({
          field: error.field,
          messages: error.constraints,
        })),
        errorCount: errors.length,
      },
      context,
    );
  }

  /**
   * レート制限エラー
   */
  static rateLimitExceeded(limit: number, windowMs: number, context = 'ThrottlerGuard'): BusinessLogicException {
    return new BusinessLogicException(
      'リクエスト制限を超過しました。しばらく時間をおいて再度お試しください',
      'RATE_LIMIT_EXCEEDED',
      {
        limit,
        windowMs,
        retryAfter: Math.ceil(windowMs / 1000),
      },
      context,
    );
  }

  /**
   * ファイルサイズエラー
   */
  static fileTooLarge(actualSize: number, maxSize: number, context = 'FileUploadService'): BusinessLogicException {
    return new BusinessLogicException(
      'ファイルサイズが制限を超えています',
      'FILE_TOO_LARGE',
      {
        actualSizeMB: Math.round((actualSize / 1024 / 1024) * 100) / 100,
        maxSizeMB: Math.round((maxSize / 1024 / 1024) * 100) / 100,
      },
      context,
    );
  }

  /**
   * 無効なファイル形式エラー
   */
  static invalidFileType(
    actualType: string,
    allowedTypes: string[],
    context = 'FileUploadService',
  ): BusinessLogicException {
    return new BusinessLogicException(
      '無効なファイル形式です',
      'INVALID_FILE_TYPE',
      {
        actualType,
        allowedTypes,
      },
      context,
    );
  }

  /**
   * ログ出力用の詳細情報を取得
   */
  getLogDetails(): Record<string, unknown> {
    return {
      errorCode: this.errorCode,
      message: this.message,
      context: this.context,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * API レスポンス用の安全な情報を取得（機密情報除外）
   */
  getPublicResponse(): Record<string, unknown> {
    return {
      success: false,
      message: this.message,
      error: this.errorCode,
      timestamp: this.timestamp,
      details: this.getSafeDetails(),
    };
  }

  /**
   * 機密情報を除外した安全な詳細情報
   */
  private getSafeDetails(): Record<string, unknown> {
    const safeDetails: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(this.details)) {
      const sensitiveKeywords = ['password', 'hash', 'secret', 'token', 'key'];
      const isSensitive = sensitiveKeywords.some(keyword => key.toLowerCase().includes(keyword));

      if (!isSensitive) {
        safeDetails[key] = value;
      }
    }

    return safeDetails;
  }
}

/**
 * タスクステータス遷移の有効性をチェック
 */
function getValidStatusTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    todo: ['in_progress', 'done', 'archived'],
    in_progress: ['todo', 'done', 'archived'],
    done: ['todo', 'in_progress', 'archived'],
    archived: ['todo'], // アーカイブからは TODO にのみ戻せる
  };

  return transitions[currentStatus] ?? [];
}
