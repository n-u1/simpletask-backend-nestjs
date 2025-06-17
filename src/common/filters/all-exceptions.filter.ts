import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { ErrorResponseDto } from '@common/dto/base-response.dto';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

/**
 * グローバル例外フィルター
 * アプリケーション全体の例外を統一的に処理
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('app.environment') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // リクエストIDを取得
    const requestId = (request.headers['x-request-id'] as string) ?? this.generateRequestId();

    // 例外の種類に応じて処理を分岐
    const exceptionResponse = this.handleException(exception, requestId);

    // セキュリティヘッダーを設定
    this.setSecurityHeaders(response);

    // レスポンスを送信
    response.status(exceptionResponse.statusCode).json(exceptionResponse.body);

    // ログを記録
    this.logException(exception, request, exceptionResponse, requestId);
  }

  /**
   * 例外の種類に応じて適切なレスポンスを生成
   */
  private handleException(
    exception: unknown,
    requestId: string,
  ): {
    statusCode: number;
    body: ErrorResponseDto;
  } {
    // カスタム例外: BusinessLogicException
    if (exception instanceof BusinessLogicException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: ErrorResponseDto.create(
          exception.message,
          exception.errorCode,
          exception.getPublicResponse().details as Record<string, unknown>,
          requestId,
        ),
      };
    }

    // カスタム例外
    if (exception instanceof ResourceNotFoundException) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: ErrorResponseDto.create(
          exception.message,
          exception.errorCode,
          {
            resourceType: exception.resourceType,
            searchCriteria: exception.searchCriteria,
          },
          requestId,
        ),
      };
    }

    // NestJS標準のHTTP例外
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return {
        statusCode: status,
        body: this.createHttpExceptionResponse(
          exceptionResponse as string | Record<string, unknown>,
          status,
          requestId,
        ),
      };
    }

    // データベース関連例外
    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseException(exception as QueryFailedError, requestId);
    }

    // TypeORMエラー
    if (this.isTypeOrmError(exception)) {
      return this.handleTypeOrmException(exception, requestId);
    }

    // バリデーションエラー（class-validator）
    if (this.isValidationError(exception)) {
      return this.handleValidationException(exception, requestId);
    }

    // その他の予期しないエラー
    return this.handleUnknownException(exception, requestId);
  }

  /**
   * HTTP例外レスポンスを作成
   */
  private createHttpExceptionResponse(
    exceptionResponse: string | Record<string, unknown>,
    status: number,
    requestId: string,
  ): ErrorResponseDto {
    if (typeof exceptionResponse === 'string') {
      return ErrorResponseDto.create(exceptionResponse, this.getErrorCodeFromStatus(status), {}, requestId);
    }

    // object型を適切にRecord<string, unknown>にキャスト
    const response = exceptionResponse;
    const message = (response.message as string) ?? 'エラーが発生しました';
    const error = (response.error as string) ?? this.getErrorCodeFromStatus(status);

    // バリデーションエラーの詳細情報を処理
    const details = response.message && Array.isArray(response.message) ? { validationErrors: response.message } : {};

    return ErrorResponseDto.create(Array.isArray(message) ? message.join(', ') : message, error, details, requestId);
  }

  /**
   * データベース例外を処理
   */
  private handleDatabaseException(
    exception: QueryFailedError,
    requestId: string,
  ): {
    statusCode: number;
    body: ErrorResponseDto;
  } {
    let errorCode = 'DATABASE_ERROR';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let userMessage = 'データベースエラーが発生しました';

    // PostgreSQL固有の主要エラーコードのみ処理
    const pgError = exception as QueryFailedError & {
      code?: string;
    };

    switch (pgError.code) {
      case '23505': // unique_violation
        errorCode = 'DUPLICATE_RESOURCE';
        statusCode = HttpStatus.CONFLICT;
        userMessage = 'このデータは既に存在します';
        break;
      case '23503': // foreign_key_violation
        errorCode = 'REFERENCE_ERROR';
        statusCode = HttpStatus.BAD_REQUEST;
        userMessage = '関連するデータが見つかりません';
        break;
      default:
        // その他のエラーは汎用メッセージ
        userMessage = 'データベースエラーが発生しました';
        break;
    }

    return {
      statusCode,
      body: ErrorResponseDto.create(userMessage, errorCode, {}, requestId),
    };
  }

  /**
   * TypeORM例外を処理
   */
  private handleTypeOrmException(
    exception: Error,
    requestId: string,
  ): {
    statusCode: number;
    body: ErrorResponseDto;
  } {
    const message = this.isProduction ? 'データベース処理でエラーが発生しました' : exception.message;

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: ErrorResponseDto.create(
        message,
        'TYPEORM_ERROR',
        this.isProduction ? {} : { originalError: exception.name },
        requestId,
      ),
    };
  }

  /**
   * バリデーション例外を処理
   */
  private handleValidationException(
    exception: Error,
    requestId: string,
  ): {
    statusCode: number;
    body: ErrorResponseDto;
  } {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      body: ErrorResponseDto.create(
        'バリデーションエラーが発生しました',
        'VALIDATION_ERROR',
        { originalMessage: exception.message },
        requestId,
      ),
    };
  }

  /**
   * 予期しない例外を処理
   */
  private handleUnknownException(
    exception: unknown,
    requestId: string,
  ): {
    statusCode: number;
    body: ErrorResponseDto;
  } {
    const message = this.isProduction
      ? 'サーバーエラーが発生しました'
      : exception instanceof Error
        ? exception.message
        : 'Unknown error occurred';

    const details = this.isProduction
      ? {}
      : {
          type: exception instanceof Error ? exception.name : typeof exception,
          stack: exception instanceof Error ? exception.stack : undefined,
        };

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: ErrorResponseDto.create(message, 'INTERNAL_SERVER_ERROR', details, requestId),
    };
  }

  /**
   * HTTPステータスコードからエラーコードを生成
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };

    return statusCodes[status] ?? 'UNKNOWN_ERROR';
  }

  /**
   * TypeORMエラーかどうか判定
   */
  private isTypeOrmError(exception: unknown): exception is Error {
    return (
      exception instanceof Error &&
      (exception.name.includes('TypeORM') ||
        exception.name.includes('Repository') ||
        exception.name.includes('Connection'))
    );
  }

  /**
   * バリデーションエラーかどうか判定
   */
  private isValidationError(exception: unknown): exception is Error {
    return (
      exception instanceof Error &&
      (exception.name.includes('Validation') || exception.message.includes('validation failed'))
    );
  }

  /**
   * セキュリティヘッダーを設定
   */
  private setSecurityHeaders(response: Response): void {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // エラーレスポンスではキャッシュを無効化
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
  }

  /**
   * 例外ログを記録
   */
  private logException(
    exception: unknown,
    request: Request,
    exceptionResponse: { statusCode: number; body: ErrorResponseDto },
    requestId: string,
  ): void {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: exceptionResponse.statusCode,
      errorCode: exceptionResponse.body.error,
      message: exceptionResponse.body.message,
      userAgent: request.get('user-agent'),
      ip: this.getClientIp(request),
      timestamp: new Date().toISOString(),
    };

    // 5xxエラーはERRORレベル、4xxエラーはWARNレベル
    if (exceptionResponse.statusCode >= 500) {
      this.logger.error('Server error occurred', {
        ...logData,
        exception: this.serializeException(exception),
      });
    } else if (exceptionResponse.statusCode >= 400) {
      this.logger.warn('Client error occurred', logData);
    } else {
      this.logger.log('Exception handled', logData);
    }
  }

  /**
   * 例外をシリアライズ（ログ用）
   */
  private serializeException(exception: unknown): Record<string, unknown> {
    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: this.isProduction ? undefined : exception.stack,
      };
    }

    return { value: String(exception) };
  }

  /**
   * クライアントIPアドレスを取得
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('x-forwarded-for');
    const realIp = request.get('x-real-ip');
    const cfConnectingIp = request.get('cf-connecting-ip');

    if (forwarded) {
      const ips = forwarded.split(',').map(ip => ip.trim());
      return ips[0] ?? 'unknown';
    }

    return realIp ?? cfConnectingIp ?? request.ip ?? 'unknown';
  }

  /**
   * リクエストIDを生成
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `req_${timestamp}_${random}`;
  }
}
