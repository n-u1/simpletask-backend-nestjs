import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';

/**
 * リフレッシュJWT認証ガード
 * リフレッシュトークンの検証を行う
 */
@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(RefreshJwtGuard.name);

  /**
   * 認証チェックを実行
   */
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 親クラスの認証処理を実行
      const result = await super.canActivate(context);

      if (!result) {
        this.logger.warn('Refresh JWT authentication failed', {
          path: this.getRequestPath(context),
          method: this.getRequestMethod(context),
        });
      }

      return result as boolean;
    } catch (error) {
      this.logger.warn('Refresh JWT authentication error', {
        path: this.getRequestPath(context),
        method: this.getRequestMethod(context),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // エラーを再スロー
      throw error;
    }
  }

  /**
   * 認証失敗時のエラーハンドリング
   */
  override handleRequest<T = unknown>(err: Error | null, user: T | false, info: unknown): T {
    if (err) {
      this.logger.error('Refresh JWT authentication error', {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }

    if (!user) {
      const errorInfo = info as { message?: string; name?: string };
      const message = errorInfo?.message ?? 'Refresh token authentication failed';
      const errorName = errorInfo?.name ?? 'RefreshAuthenticationError';

      this.logger.warn('Refresh JWT authentication failed - no user', {
        message,
        errorName,
      });

      switch (errorName) {
        case 'TokenExpiredError':
          throw new BusinessLogicException(
            AuthErrorMessages.REFRESH_TOKEN_EXPIRED,
            'REFRESH_TOKEN_EXPIRED',
            {},
            'RefreshJwtGuard.handleRequest',
          );

        case 'JsonWebTokenError':
          throw new BusinessLogicException(
            AuthErrorMessages.REFRESH_TOKEN_INVALID,
            'REFRESH_TOKEN_INVALID',
            {},
            'RefreshJwtGuard.handleRequest',
          );

        case 'NotBeforeError':
          throw new BusinessLogicException(
            AuthErrorMessages.REFRESH_TOKEN_INACTIVE,
            'REFRESH_TOKEN_INACTIVE',
            {},
            'RefreshJwtGuard.handleRequest',
          );

        default:
          throw new BusinessLogicException(
            AuthErrorMessages.REFRESH_TOKEN_INVALID,
            'REFRESH_TOKEN_INVALID',
            { reason: message },
            'RefreshJwtGuard.handleRequest',
          );
      }
    }

    return user;
  }

  /**
   * リクエストパスを取得
   */
  private getRequestPath(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    return request.path ?? 'unknown';
  }

  /**
   * リクエストメソッドを取得
   */
  private getRequestMethod(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<Request>();
    return request.method ?? 'unknown';
  }
}
