import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';

/**
 * JWT認証ガード
 * アクセストークンの検証を行う
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * 認証チェックを実行
   */
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // パブリックエンドポイントのチェック
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    try {
      // 親クラスの認証処理を実行
      const result = await super.canActivate(context);

      if (!result) {
        this.logger.warn('JWT authentication failed', {
          path: this.getRequestPath(context),
          method: this.getRequestMethod(context),
        });
      }

      return result as boolean;
    } catch (error) {
      this.logger.warn('JWT authentication error', {
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
      this.logger.error('JWT authentication error', {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }

    if (!user) {
      const errorInfo = info as { message?: string; name?: string };
      const message = errorInfo?.message ?? 'Authentication failed';
      const errorName = errorInfo?.name ?? 'AuthenticationError';

      this.logger.warn('JWT authentication failed - no user', {
        message,
        errorName,
      });

      switch (errorName) {
        case 'TokenExpiredError':
          throw new BusinessLogicException(
            AuthErrorMessages.TOKEN_EXPIRED,
            'TOKEN_EXPIRED',
            {},
            'JwtAuthGuard.handleRequest',
          );

        case 'JsonWebTokenError':
          throw new BusinessLogicException(
            AuthErrorMessages.TOKEN_INVALID,
            'TOKEN_INVALID',
            {},
            'JwtAuthGuard.handleRequest',
          );

        case 'NotBeforeError':
          throw new BusinessLogicException(
            AuthErrorMessages.TOKEN_INACTIVE,
            'TOKEN_INACTIVE',
            {},
            'JwtAuthGuard.handleRequest',
          );

        default:
          throw new BusinessLogicException(
            AuthErrorMessages.UNAUTHORIZED,
            'UNAUTHORIZED',
            { reason: message },
            'JwtAuthGuard.handleRequest',
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
