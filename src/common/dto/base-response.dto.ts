import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { PaginationMetaDto } from './pagination.dto';

/**
 * API成功レスポンスの基底クラス
 * 全ての成功レスポンスで統一された形式を提供
 */
export class BaseResponseDto<T = unknown> {
  @ApiProperty({
    description: '処理成功フラグ',
    example: true,
  })
  @IsBoolean()
  success!: true;

  @ApiProperty({
    description: 'レスポンスデータ',
  })
  data!: T;

  @ApiPropertyOptional({
    description: '処理成功メッセージ',
    example: '操作が正常に完了しました',
  })
  @IsOptional()
  @IsString()
  message?: string | undefined;

  @ApiProperty({
    description: 'レスポンス生成時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  constructor(data: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 成功レスポンスを作成
   */
  static create<T>(data: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(data, message);
  }

  /**
   * 空の成功レスポンスを作成（削除処理等で使用）
   */
  static createEmpty(message?: string): BaseResponseDto<null> {
    return new BaseResponseDto(null, message);
  }
}

/**
 * ページネーション付きレスポンスDTO
 */
export class PaginatedResponseDto<T = unknown> {
  @ApiProperty({
    description: '処理成功フラグ',
    example: true,
  })
  @IsBoolean()
  success!: true;

  @ApiProperty({
    description: 'データ配列',
    isArray: true,
  })
  @IsArray()
  data!: T[];

  @ApiProperty({
    description: 'ページネーション情報',
    type: PaginationMetaDto,
  })
  @ValidateNested()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;

  @ApiPropertyOptional({
    description: '処理成功メッセージ',
    example: 'データを正常に取得しました',
  })
  @IsOptional()
  @IsString()
  message?: string | undefined;

  @ApiProperty({
    description: 'レスポンス生成時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  constructor(data: T[], meta: PaginationMetaDto, message?: string) {
    this.success = true;
    this.data = data;
    this.meta = meta;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  /**
   * ページネーション付きレスポンスを作成
   */
  static create<T>(data: T[], meta: PaginationMetaDto, message?: string): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, meta, message);
  }
}

/**
 * エラーレスポンスDTO
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: '処理失敗フラグ',
    example: false,
  })
  @IsBoolean()
  success!: false;

  @ApiProperty({
    description: 'エラーメッセージ',
    example: 'リソースが見つかりません',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'エラーコード',
    example: 'RESOURCE_NOT_FOUND',
  })
  @IsString()
  error!: string;

  @ApiPropertyOptional({
    description: 'エラー詳細情報',
    additionalProperties: true,
    example: {
      field: 'email',
      value: 'invalid-email',
      constraint: 'isEmail',
    },
  })
  @IsOptional()
  details?: Record<string, unknown> | undefined;

  @ApiProperty({
    description: 'エラー発生時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'リクエストID（トレーシング用）',
    example: 'req_550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  requestId?: string | undefined;

  constructor(message: string, error: string, details?: Record<string, unknown>, requestId?: string) {
    this.success = false;
    this.message = message;
    this.error = error;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }

  /**
   * エラーレスポンスを作成
   */
  static create(
    message: string,
    error: string,
    details?: Record<string, unknown>,
    requestId?: string,
  ): ErrorResponseDto {
    return new ErrorResponseDto(message, error, details, requestId);
  }

  /**
   * バリデーションエラーレスポンスを作成
   */
  static createValidationError(
    errors: Array<{
      field: string;
      value: unknown;
      constraints: Record<string, string>;
    }>,
    requestId?: string,
  ): ErrorResponseDto {
    const details = {
      validationErrors: errors.map(error => ({
        field: error.field,
        value: error.value,
        messages: Object.values(error.constraints),
      })),
    };

    return new ErrorResponseDto('バリデーションエラーが発生しました', 'VALIDATION_ERROR', details, requestId);
  }
}

/**
 * リスト取得レスポンスDTO（ページネーションなし）
 */
export class ListResponseDto<T = unknown> {
  @ApiProperty({
    description: '処理成功フラグ',
    example: true,
  })
  @IsBoolean()
  success!: true;

  @ApiProperty({
    description: 'データ配列',
    isArray: true,
  })
  @IsArray()
  data!: T[];

  @ApiProperty({
    description: '総件数',
    example: 42,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  count!: number;

  @ApiPropertyOptional({
    description: '処理成功メッセージ',
    example: 'データを正常に取得しました',
  })
  @IsOptional()
  @IsString()
  message?: string | undefined;

  @ApiProperty({
    description: 'レスポンス生成時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  constructor(data: T[], message?: string) {
    this.success = true;
    this.data = data;
    this.count = data.length;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  /**
   * リストレスポンスを作成
   */
  static create<T>(data: T[], message?: string): ListResponseDto<T> {
    return new ListResponseDto(data, message);
  }
}

/**
 * 単一リソース作成レスポンスDTO
 */
export class CreatedResponseDto<T = unknown> {
  @ApiProperty({
    description: '処理成功フラグ',
    example: true,
  })
  @IsBoolean()
  success!: true;

  @ApiProperty({
    description: '作成されたリソースデータ',
  })
  data!: T;

  @ApiProperty({
    description: '作成完了メッセージ',
    example: 'リソースが正常に作成されました',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'レスポンス生成時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  @ApiPropertyOptional({
    description: '作成されたリソースのURL',
    example: '/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  location?: string | undefined;

  constructor(data: T, message: string, location?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.location = location;
  }

  /**
   * 作成成功レスポンスを作成
   */
  static create<T>(data: T, message: string, location?: string): CreatedResponseDto<T> {
    return new CreatedResponseDto(data, message, location);
  }
}

/**
 * 削除成功レスポンスDTO
 */
export class DeletedResponseDto {
  @ApiProperty({
    description: '処理成功フラグ',
    example: true,
  })
  @IsBoolean()
  success!: true;

  @ApiProperty({
    description: '削除されたリソースのID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  deletedId!: string;

  @ApiProperty({
    description: '削除完了メッセージ',
    example: 'リソースが正常に削除されました',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'レスポンス生成時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  constructor(deletedId: string, message: string) {
    this.success = true;
    this.deletedId = deletedId;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 削除成功レスポンスを作成
   */
  static create(deletedId: string, message: string): DeletedResponseDto {
    return new DeletedResponseDto(deletedId, message);
  }
}

/**
 * ヘルスチェックレスポンスDTO
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'サービス状態',
    example: 'ok',
    enum: ['ok', 'error'],
  })
  @IsString()
  status!: 'ok' | 'error';

  @ApiProperty({
    description: 'サービス詳細情報',
    additionalProperties: true,
    example: {
      database: 'up',
      redis: 'up',
      uptime: 3600,
    },
  })
  info!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'エラー情報',
    additionalProperties: true,
  })
  @IsOptional()
  error?: Record<string, unknown> | undefined;

  @ApiProperty({
    description: 'サービス詳細',
    additionalProperties: true,
    example: {
      database: {
        status: 'up',
        responseTime: 5,
      },
      redis: {
        status: 'up',
        responseTime: 2,
      },
    },
  })
  details!: Record<string, unknown>;

  @ApiProperty({
    description: 'ヘルスチェック実行時刻（ISO 8601形式）',
    example: '2025-06-11T10:30:00.000Z',
  })
  @IsString()
  timestamp!: string;

  constructor(
    status: 'ok' | 'error',
    info: Record<string, unknown>,
    details: Record<string, unknown>,
    error?: Record<string, unknown>,
  ) {
    this.status = status;
    this.info = info;
    this.details = details;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * レスポンス型のユニオン（型ガード用）
 */
export type ApiResponseDto<T = unknown> =
  | BaseResponseDto<T>
  | PaginatedResponseDto<T>
  | ListResponseDto<T>
  | CreatedResponseDto<T>
  | DeletedResponseDto
  | ErrorResponseDto;

/**
 * レスポンスタイプガード
 */
export const isSuccessResponse = <T>(
  response: ApiResponseDto<T>,
): response is BaseResponseDto<T> | PaginatedResponseDto<T> | ListResponseDto<T> | CreatedResponseDto<T> => {
  return response.success === true;
};

export const isErrorResponse = <T>(response: ApiResponseDto<T>): response is ErrorResponseDto => {
  return response.success === false;
};

export const isPaginatedResponse = <T>(response: ApiResponseDto<T>): response is PaginatedResponseDto<T> => {
  return response.success === true && 'meta' in response;
};
