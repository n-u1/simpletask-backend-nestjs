import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

/**
 * ログ記録インターセプター
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // リクエストID生成
    const requestId = this.generateRequestId();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    // リクエスト開始ログ
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logSuccess(request, response, duration, requestId);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        this.logError(request, response, duration, requestId, error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * リクエスト開始ログ
   */
  private logRequest(request: Request, requestId: string): void {
    // ヘルスチェックは除外
    if (this.shouldSkipLogging(request)) {
      return;
    }

    this.logger.log(`[${requestId}] ${request.method} ${request.url}`, {
      method: request.method,
      url: request.url,
      ip: this.getClientIp(request),
      userAgent: request.get('user-agent')?.slice(0, 100),
      body: this.sanitizeBody(request.body),
    });
  }

  /**
   * 成功ログ
   */
  private logSuccess(request: Request, response: Response, duration: number, requestId: string): void {
    if (this.shouldSkipLogging(request)) {
      return;
    }

    const logLevel = duration > 3000 ? 'warn' : 'log';
    const message = `[${requestId}] ${response.statusCode} ${duration}ms`;

    this.logger[logLevel](message, {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
    });
  }

  /**
   * エラーログ
   */
  private logError(request: Request, response: Response, duration: number, requestId: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error(`[${requestId}] ERROR ${duration}ms - ${errorMessage}`, {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
      },
    });
  }

  /**
   * リクエストID生成
   */
  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * クライアントIP取得
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0]?.trim() ?? 'unknown';
    }
    return request.get('x-real-ip') ?? request.ip ?? 'unknown';
  }

  /**
   * リクエストボディのサニタイズ（機密情報除去）
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveFields = ['password', 'token', 'secret'];

    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * ログ出力をスキップするかどうか
   */
  private shouldSkipLogging(request: Request): boolean {
    const skipPaths = ['/health', '/favicon.ico'];
    return skipPaths.some(path => request.url.includes(path));
  }
}
