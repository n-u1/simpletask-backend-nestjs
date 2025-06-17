import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { User } from '@/users/entities/user.entity';

/**
 * 現在のユーザー情報を取得するデコレータ
 * JWT認証ガードによってリクエストに設定されたユーザー情報を取得
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @Get('profile')
 * async getProfile(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: User }).user;

    if (!user) {
      return undefined;
    }

    // 特定のフィールドが指定された場合はそのフィールドの値を返す
    if (data) {
      return user[data] as string;
    }

    // フィールド指定がない場合はUserオブジェクト全体を返す
    return user;
  },
);

/**
 * 必須ユーザー情報デコレータ
 * ユーザーが認証されていない場合はエラーを投げる
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@RequiredUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const RequiredUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: User }).user;

    if (!user) {
      throw new Error('認証されたユーザー情報が見つかりません');
    }

    // ユーザーオブジェクトの基本的な検証
    if (!user.id || typeof user.id !== 'string') {
      throw new Error('無効なユーザー情報です');
    }

    // 特定のフィールドが指定された場合はそのフィールドの値を返す
    if (data) {
      const fieldValue = user[data];
      if (fieldValue === undefined || fieldValue === null) {
        throw new Error(`ユーザーの${data}情報が見つかりません`);
      }
      return fieldValue as string;
    }

    // フィールド指定がない場合はUserオブジェクト全体を返す
    return user;
  },
);

/**
 * ユーザーIDのみを取得するデコレータ
 *
 * @example
 * ```typescript
 * @Get('tasks')
 * async getTasks(@UserId() userId: string) {
 *   return this.tasksService.findByUserId(userId);
 * }
 * ```
 */
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = (request as Request & { user?: User }).user;

  if (!user || !user.id) {
    throw new Error('認証されたユーザーIDが見つかりません');
  }

  return user.id;
});

/**
 * オプショナルユーザーIDデコレータ
 * 認証が任意のエンドポイントで使用
 *
 * @example
 * ```typescript
 * @Get('public-tasks')
 * async getPublicTasks(@OptionalUserId() userId?: string) {
 *   if (userId) {
 *     return this.tasksService.findPersonalizedTasks(userId);
 *   } else {
 *     return this.tasksService.findPublicTasks();
 *   }
 * }
 * ```
 */
export const OptionalUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = (request as Request & { user?: User }).user;

  return user?.id;
});

/**
 * ユーザー情報の存在確認デコレータ
 * 条件分岐での使用を想定（boolean値を返す）
 *
 * @example
 * ```typescript
 * @Get('status')
 * async getStatus(@IsAuthenticated() isAuth: boolean) {
 *   return {
 *     authenticated: isAuth,
 *     timestamp: new Date().toISOString()
 *   };
 * }
 * ```
 */
export const IsAuthenticated = createParamDecorator((_data: unknown, ctx: ExecutionContext): boolean => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = (request as Request & { user?: User }).user;

  return Boolean(user && user.id);
});

/**
 * ユーザー情報を安全に取得するヘルパー関数
 * デコレータ以外の場所での使用を想定
 */
export function extractUserFromRequest(request: Request): User | null {
  const user = (request as Request & { user?: User }).user;

  if (!user || !user.id || typeof user.id !== 'string') {
    return null;
  }

  return user;
}

/**
 * ユーザーIDを安全に取得するヘルパー関数
 */
export function extractUserIdFromRequest(request: Request): string | null {
  const user = extractUserFromRequest(request);
  return user?.id ?? null;
}

/**
 * ユーザーが特定の条件を満たすかチェックするヘルパー関数
 */
export function checkUserCondition(request: Request, condition: (user: User) => boolean): boolean {
  const user = extractUserFromRequest(request);

  if (!user) {
    return false;
  }

  return condition(user);
}
