import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import {
  BaseResponseDto,
  CreatedResponseDto,
  DeletedResponseDto,
  ErrorResponseDto,
  ListResponseDto,
  PaginatedResponseDto,
} from '@common/dto/base-response.dto';
import { PaginationMetaDto } from '@common/dto/pagination.dto';

/**
 * 成功レスポンス用デコレータ
 * BaseResponseDto を使用した統一されたAPI文書化
 *
 * @param dataType レスポンスデータの型
 * @param description レスポンスの説明
 * @param statusCode HTTPステータスコード（デフォルト: 200）
 */
export function ApiSuccessResponse<T>(dataType: Type<T>, description = 'Success', statusCode = 200): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, dataType),
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dataType) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * ページネーション付きレスポンス用デコレータ
 * PaginatedResponseDto を使用したAPI文書化
 *
 * @param dataType レスポンスデータの型
 * @param description レスポンスの説明
 */
export function ApiPaginatedResponse<T>(
  dataType: Type<T>,
  description = 'Paginated data retrieved successfully',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, PaginationMetaDto, dataType),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataType) },
              },
              meta: { $ref: getSchemaPath(PaginationMetaDto) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * リストレスポンス用デコレータ（ページネーションなし）
 * ListResponseDto を使用したAPI文書化
 *
 * @param dataType レスポンスデータの型
 * @param description レスポンスの説明
 */
export function ApiListResponse<T>(
  dataType: Type<T>,
  description = 'List data retrieved successfully',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ListResponseDto, dataType),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ListResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataType) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 作成成功レスポンス用デコレータ
 * CreatedResponseDto を使用したAPI文書化
 *
 * @param dataType 作成されたリソースの型
 * @param description レスポンスの説明
 */
export function ApiCreatedResponse<T>(
  dataType: Type<T>,
  description = 'Resource created successfully',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(CreatedResponseDto, dataType),
    ApiResponse({
      status: 201,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(CreatedResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dataType) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 削除成功レスポンス用デコレータ
 * DeletedResponseDto を使用したAPI文書化
 */
export function ApiDeletedResponse(description = 'Resource deleted successfully'): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(DeletedResponseDto),
    ApiResponse({
      status: 200,
      description,
      schema: { $ref: getSchemaPath(DeletedResponseDto) },
    }),
  );
}

/**
 * エラーレスポンス用デコレータ
 * ErrorResponseDto を使用したAPI文書化
 *
 * @param statusCode HTTPステータスコード
 * @param description エラーの説明
 */
export function ApiErrorResponse(statusCode: number, description: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: statusCode,
      description,
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    }),
  );
}

/**
 * 認証エラーレスポンス用デコレータ
 */
export function ApiUnauthorizedResponse(description = 'Unauthorized - Authentication required'): MethodDecorator {
  return ApiErrorResponse(401, description);
}

/**
 * 権限不足エラーレスポンス用デコレータ
 */
export function ApiForbiddenResponse(description = 'Forbidden - Insufficient permissions'): MethodDecorator {
  return ApiErrorResponse(403, description);
}

/**
 * リソース未発見エラーレスポンス用デコレータ
 */
export function ApiNotFoundResponse(description = 'Resource not found'): MethodDecorator {
  return ApiErrorResponse(404, description);
}

/**
 * バリデーションエラーレスポンス用デコレータ
 */
export function ApiBadRequestResponse(description = 'Bad Request - Validation failed'): MethodDecorator {
  return ApiErrorResponse(400, description);
}

/**
 * 競合エラーレスポンス用デコレータ
 */
export function ApiConflictResponse(description = 'Conflict - Resource already exists'): MethodDecorator {
  return ApiErrorResponse(409, description);
}

/**
 * レート制限エラーレスポンス用デコレータ
 */
export function ApiTooManyRequestsResponse(description = 'Too Many Requests - Rate limit exceeded'): MethodDecorator {
  return ApiErrorResponse(429, description);
}

/**
 * サーバーエラーレスポンス用デコレータ
 */
export function ApiInternalServerErrorResponse(description = 'Internal Server Error'): MethodDecorator {
  return ApiErrorResponse(500, description);
}

/**
 * CRUD API用の複合デコレータ
 * 一般的なレスポンスパターンをまとめて適用
 */

/**
 * GET（単一リソース取得）用デコレータ
 */
export function ApiGetResponse<T>(dataType: Type<T>, resourceName = 'Resource'): MethodDecorator {
  return applyDecorators(
    ApiSuccessResponse(dataType, `${resourceName} retrieved successfully`),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(`${resourceName} not found`),
    ApiInternalServerErrorResponse(),
  );
}

/**
 * GET（リスト取得）用デコレータ
 */
export function ApiGetListResponse<T>(
  dataType: Type<T>,
  resourceName = 'Resources',
  paginated = false,
): MethodDecorator {
  const responseDecorator = paginated
    ? ApiPaginatedResponse(dataType, `${resourceName} list retrieved successfully`)
    : ApiListResponse(dataType, `${resourceName} list retrieved successfully`);

  return applyDecorators(
    responseDecorator,
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiInternalServerErrorResponse(),
  );
}

/**
 * POST用デコレータ
 */
export function ApiPostResponse<T>(dataType: Type<T>, resourceName = 'Resource'): MethodDecorator {
  return applyDecorators(
    ApiCreatedResponse(dataType, `${resourceName} created successfully`),
    ApiBadRequestResponse('Validation failed'),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiConflictResponse(`${resourceName} already exists`),
    ApiInternalServerErrorResponse(),
  );
}

/**
 * PUT/PATCH用デコレータ
 */
export function ApiPutResponse<T>(dataType: Type<T>, resourceName = 'Resource'): MethodDecorator {
  return applyDecorators(
    ApiSuccessResponse(dataType, `${resourceName} updated successfully`),
    ApiBadRequestResponse('Validation failed'),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(`${resourceName} not found`),
    ApiInternalServerErrorResponse(),
  );
}

/**
 * DELETE用デコレータ
 */
export function ApiDeleteResponse(resourceName = 'Resource'): MethodDecorator {
  return applyDecorators(
    ApiDeletedResponse(`${resourceName} deleted successfully`),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(`${resourceName} not found`),
    ApiInternalServerErrorResponse(),
  );
}
