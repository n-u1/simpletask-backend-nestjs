import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * リソース未発見例外
 * 要求されたリソースが存在しない場合の例外クラス
 * HTTPステータスコード404（Not Found）で返される
 */
export class ResourceNotFoundException extends HttpException {
  /**
   * リソースタイプ（user, task, tag など）
   */
  public readonly resourceType: string;

  /**
   * リソースID
   */
  public readonly resourceId: string;

  /**
   * エラーコード（ログ・モニタリング用）
   */
  public readonly errorCode: string;

  /**
   * エラー詳細情報
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

  /**
   * 検索条件（IDではない検索の場合）
   */
  public readonly searchCriteria: Record<string, unknown>;

  constructor(
    resourceType: string,
    resourceId: string,
    message?: string,
    searchCriteria: Record<string, unknown> = {},
    context = 'Unknown',
  ) {
    const defaultMessage = `${resourceType}が見つかりません`;
    const finalMessage = message ?? defaultMessage;

    // HTTPException の基底クラスを初期化
    super(
      {
        success: false,
        message: finalMessage,
        error: 'RESOURCE_NOT_FOUND',
        details: {
          resourceType,
          resourceId: ResourceNotFoundException.maskSensitiveId(resourceId),
          searchCriteria: ResourceNotFoundException.maskSensitiveData(searchCriteria),
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );

    this.name = 'ResourceNotFoundException';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.errorCode = 'RESOURCE_NOT_FOUND';
    this.searchCriteria = searchCriteria;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.details = {
      resourceType,
      resourceId: ResourceNotFoundException.maskSensitiveId(resourceId),
      searchCriteria: ResourceNotFoundException.maskSensitiveData(searchCriteria),
    };

    // スタックトレースを設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResourceNotFoundException);
    }
  }

  /**
   * ユーザーが見つからない場合
   */
  static user(userId: string, context = 'UserService'): ResourceNotFoundException {
    return new ResourceNotFoundException('User', userId, 'ユーザーが見つかりません', {}, context);
  }

  /**
   * メールアドレスでユーザーが見つからない場合
   */
  static userByEmail(email: string, context = 'AuthService'): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'User',
      email, // リソースIDとしてメールアドレスを使用
      'ユーザーが見つかりません',
      { searchBy: 'email' },
      context,
    );
  }

  /**
   * タスクが見つからない場合
   */
  static task(taskId: string, userId?: string, context = 'TaskService'): ResourceNotFoundException {
    const searchCriteria = userId ? { ownerId: userId } : {};

    return new ResourceNotFoundException('Task', taskId, 'タスクが見つかりません', searchCriteria, context);
  }

  /**
   * 複数のタスクが見つからない場合
   */
  static tasks(taskIds: string[], userId?: string, context = 'TaskService'): ResourceNotFoundException {
    const searchCriteria = userId
      ? { ownerId: userId, requestedCount: taskIds.length }
      : { requestedCount: taskIds.length };

    return new ResourceNotFoundException(
      'Task',
      taskIds.join(','),
      `${taskIds.length}件のタスクのうち一部が見つかりません`,
      searchCriteria,
      context,
    );
  }

  /**
   * タグが見つからない場合
   */
  static tag(tagId: string, userId?: string, context = 'TagService'): ResourceNotFoundException {
    const searchCriteria = userId ? { ownerId: userId } : {};

    return new ResourceNotFoundException('Tag', tagId, 'タグが見つかりません', searchCriteria, context);
  }

  /**
   * タグ名でタグが見つからない場合
   */
  static tagByName(tagName: string, userId: string, context = 'TagService'): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Tag',
      tagName,
      'タグが見つかりません',
      { searchBy: 'name', ownerId: userId },
      context,
    );
  }

  /**
   * タスク・タグ関連付けが見つからない場合
   */
  static taskTag(taskId: string, tagId: string, context = 'TaskTagService'): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'TaskTag',
      `${taskId}:${tagId}`,
      'タスクとタグの関連付けが見つかりません',
      { taskId, tagId },
      context,
    );
  }

  /**
   * ページネーション結果が空の場合
   */
  static emptyPage(
    resourceType: string,
    page: number,
    limit: number,
    context = 'PaginationService',
  ): ResourceNotFoundException {
    return new ResourceNotFoundException(
      resourceType,
      `page-${page}`,
      `指定されたページには${resourceType}が存在しません`,
      { page, limit, searchType: 'pagination' },
      context,
    );
  }

  /**
   * 検索条件に一致するリソースが見つからない場合
   */
  static bySearchCriteria(
    resourceType: string,
    searchCriteria: Record<string, unknown>,
    context = 'SearchService',
  ): ResourceNotFoundException {
    return new ResourceNotFoundException(
      resourceType,
      'search-result',
      `検索条件に一致する${resourceType}が見つかりません`,
      { ...searchCriteria, searchType: 'criteria' },
      context,
    );
  }

  /**
   * ファイル・画像が見つからない場合
   */
  static file(fileName: string, path?: string, context = 'FileService'): ResourceNotFoundException {
    const searchCriteria = path ? { path } : {};

    return new ResourceNotFoundException('File', fileName, 'ファイルが見つかりません', searchCriteria, context);
  }

  /**
   * 設定値が見つからない場合
   */
  static config(configKey: string, context = 'ConfigService'): ResourceNotFoundException {
    return new ResourceNotFoundException('Config', configKey, '設定値が見つかりません', { configKey }, context);
  }

  /**
   * APIエンドポイント（ルート）が見つからない場合
   */
  static endpoint(method: string, path: string, context = 'Router'): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Endpoint',
      `${method} ${path}`,
      'APIエンドポイントが見つかりません',
      { method, path },
      context,
    );
  }

  /**
   * ログ出力用の詳細情報を取得
   */
  getLogDetails(): Record<string, unknown> {
    return {
      errorCode: this.errorCode,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      searchCriteria: this.searchCriteria,
      context: this.context,
      message: this.message,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * API レスポンス用の安全な情報を取得
   */
  getPublicResponse(): Record<string, unknown> {
    return {
      success: false,
      message: this.message,
      error: this.errorCode,
      details: {
        resourceType: this.resourceType,
        resourceId: ResourceNotFoundException.maskSensitiveId(this.resourceId),
        searchCriteria: ResourceNotFoundException.maskSensitiveData(this.searchCriteria),
      },
      timestamp: this.timestamp,
    };
  }

  /**
   * リソースIDの機密情報をマスキング
   */
  private static maskSensitiveId(id: string): string {
    // UUIDの場合は末尾8文字のみ表示
    if (id.includes('-') && id.length === 36) {
      return `***-${id.slice(-8)}`;
    }

    // メールアドレスの場合
    if (id.includes('@')) {
      const parts = id.split('@');
      const local = parts[0];
      const domain = parts[1];

      if (!local || !domain) {
        return '***@***';
      }

      const maskedLocal = local.length > 3 ? `${local.slice(0, 2)}***` : '***';
      return `${maskedLocal}@${domain}`;
    }

    // その他の文字列の場合
    if (id.length > 8) {
      return `${id.slice(0, 3)}***${id.slice(-3)}`;
    }

    return '***';
  }

  /**
   * 検索条件の機密情報をマスキング
   */
  private static maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const maskedData: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'hash', 'secret', 'token', 'key', 'email'];

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));

      if (isSensitive && typeof value === 'string') {
        maskedData[key] = this.maskSensitiveId(value);
      } else {
        maskedData[key] = value;
      }
    }

    return maskedData;
  }

  /**
   * 関連リソースの情報を追加
   */
  addRelatedResource(relatedType: string, relatedId: string): ResourceNotFoundException {
    this.details.relatedResource = {
      type: relatedType,
      id: ResourceNotFoundException.maskSensitiveId(relatedId),
    };

    return this;
  }

  /**
   * 推奨アクションを追加
   */
  addSuggestion(suggestion: string): ResourceNotFoundException {
    this.details.suggestion = suggestion;
    return this;
  }

  /**
   * 検索範囲の情報を追加
   */
  addSearchScope(scope: Record<string, unknown>): ResourceNotFoundException {
    this.details.searchScope = ResourceNotFoundException.maskSensitiveData(scope);
    return this;
  }
}
