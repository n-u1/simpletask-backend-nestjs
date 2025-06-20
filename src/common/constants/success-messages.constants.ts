/**
 * 成功メッセージ定数
 * アプリケーション全体で使用する成功メッセージを統一管理
 */

// =============================================================================
// 認証関連成功メッセージ
// =============================================================================

export class AuthSuccessMessages {
  static readonly USER_CREATED = 'ユーザーが正常に作成されました';
  static readonly USER_INFO_RETRIEVED = 'ユーザー情報を取得しました';
  static readonly PROFILE_RETRIEVED = 'プロフィールを取得しました';
  static readonly PROFILE_UPDATED = 'プロフィールが更新されました';
  static readonly ACCOUNT_DEACTIVATED = 'アカウントが無効化されました';
  static readonly LOGIN_SUCCESS = 'ログインしました';
  static readonly LOGOUT_SUCCESS = 'ログアウトしました';
  static readonly PASSWORD_CHANGED = 'パスワードが変更されました';
  static readonly EMAIL_VERIFIED = 'メールアドレスが認証されました';
  static readonly EMAIL_CHANGED = 'メールアドレスが変更されました';
  static readonly PASSWORD_RESET_SENT = 'パスワードリセット用のメールを送信しました';
  static readonly TOKEN_REFRESHED = 'トークンが更新されました';
}

// =============================================================================
// タスク関連成功メッセージ
// =============================================================================

export class TaskSuccessMessages {
  static readonly TASK_CREATED = 'タスクが作成されました';
  static readonly TASK_UPDATED = 'タスクが更新されました';
  static readonly TASK_DELETED = 'タスクが削除されました';
  static readonly TASK_DETAIL_RETRIEVED = 'プロフィールを取得しました';
  static readonly TASK_STATUS_UPDATED = 'タスクのステータスが更新されました';
  static readonly TASK_COMPLETED = 'タスクが完了しました';
  static readonly TASK_ARCHIVED = 'タスクがアーカイブされました';
  static readonly TASK_RESTORED = 'タスクが復元されました';
  static readonly TASK_POSITION_UPDATED = 'タスクの順序が更新されました';
  static readonly TASKS_BULK_UPDATED = '複数のタスクが更新されました';
}

// =============================================================================
// タグ関連成功メッセージ
// =============================================================================

export class TagSuccessMessages {
  static readonly TAG_CREATED = 'タグが作成されました';
  static readonly TAG_UPDATED = 'タグが更新されました';
  static readonly TAG_DELETED = 'タグが削除されました';
  static readonly TAG_COLOR_UPDATED = 'タグの色が更新されました';
  static readonly TAG_ATTACHED = 'タグが追加されました';
  static readonly TAG_DETACHED = 'タグが削除されました';
  static readonly TAGS_BULK_UPDATED = '複数のタグが更新されました';
}

// =============================================================================
// 一般的な成功メッセージ
// =============================================================================

export class GeneralSuccessMessages {
  static readonly OPERATION_COMPLETED = '操作が完了しました';
  static readonly DATA_SAVED = 'データが保存されました';
  static readonly DATA_EXPORTED = 'データがエクスポートされました';
  static readonly DATA_IMPORTED = 'データがインポートされました';
  static readonly SETTINGS_UPDATED = '設定が更新されました';
  static readonly CACHE_CLEARED = 'キャッシュがクリアされました';
  static readonly BACKUP_CREATED = 'バックアップが作成されました';
  static readonly RESTORE_COMPLETED = '復元が完了しました';
}
