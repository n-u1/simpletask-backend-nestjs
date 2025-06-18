import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  ValidationPipe as NestValidationPipe,
  PipeTransform,
  ValidationError,
  ValidationPipeOptions,
} from '@nestjs/common';

import { GeneralErrorMessages, ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { ValidationMessages } from '@common/constants/validation.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';

/**
 * カスタムバリデーションパイプ
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  private readonly validationPipe: NestValidationPipe;

  constructor(options?: ValidationPipeOptions) {
    const defaultOptions: ValidationPipeOptions = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      },
      // 全エラーを収集
      stopAtFirstError: false,
      // カスタムエラーファクトリー
      exceptionFactory: this.createValidationException.bind(this),
    };

    this.validationPipe = new NestValidationPipe({
      ...defaultOptions,
      ...options,
    });
  }

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    try {
      return await this.validationPipe.transform(value, metadata);
    } catch (error) {
      if (error instanceof BusinessLogicException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        const response = error.getResponse();
        if (typeof response === 'object' && response !== null && 'message' in response) {
          const errorResponse = response as { message: unknown };
          if (Array.isArray(errorResponse.message)) {
            throw this.createValidationExceptionFromMessages(errorResponse.message);
          }
        }
      }

      throw BusinessLogicException.validationFailed(
        [{ field: 'unknown', value: 'unknown', constraints: [GeneralErrorMessages.VALIDATION_ERROR] }],
        'CustomValidationPipe',
      );
    }
  }

  /**
   * バリデーションエラーからカスタム例外を作成
   */
  private createValidationException(errors: ValidationError[]): BusinessLogicException {
    const formattedErrors = this.formatValidationErrors(errors);
    return BusinessLogicException.validationFailed(formattedErrors, 'CustomValidationPipe');
  }

  /**
   * メッセージ配列からカスタム例外を作成
   */
  private createValidationExceptionFromMessages(messages: unknown[]): BusinessLogicException {
    const errors = messages.map((message, index) => ({
      field: `field_${index}`,
      value: 'unknown',
      constraints: [typeof message === 'string' ? message : GeneralErrorMessages.VALIDATION_ERROR],
    }));

    return BusinessLogicException.validationFailed(errors, 'CustomValidationPipe');
  }

  /**
   * ValidationErrorを統一フォーマットに変換
   */
  private formatValidationErrors(
    errors: ValidationError[],
    parentProperty = '',
  ): Array<{
    field: string;
    value: unknown;
    constraints: string[];
  }> {
    const formattedErrors: Array<{
      field: string;
      value: unknown;
      constraints: string[];
    }> = [];

    for (const error of errors) {
      const propertyPath = parentProperty ? `${parentProperty}.${error.property}` : error.property;

      // 制約エラーがある場合
      if (error.constraints) {
        const constraints = Object.values(error.constraints);

        formattedErrors.push({
          field: propertyPath,
          value: this.sanitizeValue(error.value),
          constraints,
        });
      }

      // ネストしたエラーがある場合は再帰的に処理
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatValidationErrors(error.children, propertyPath);
        formattedErrors.push(...nestedErrors);
      }
    }

    return formattedErrors;
  }

  /**
   * バリデーション値のサニタイズ
   */
  private sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // 文字列の場合
    if (typeof value === 'string') {
      // 長すぎる文字列は切り詰め
      if (value.length > 100) {
        return `${value.slice(0, 50)}...(${value.length} chars)`;
      }

      // パスワードらしき文字列をマスキング
      if (value.length >= 8 && /password|secret|token/i.test(value)) {
        return '***';
      }

      return value;
    }

    // 配列の場合
    if (Array.isArray(value)) {
      if (value.length > 10) {
        return `[Array with ${value.length} elements]`;
      }
      return value.map(item => this.sanitizeValue(item));
    }

    // オブジェクトの場合
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length > 10) {
        return `[Object with ${entries.length} properties]`;
      }

      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, val] of entries) {
        // 機密情報のキーはマスキング
        const isSensitive = /password|secret|token|key/i.test(key);
        sanitizedObj[key] = isSensitive ? '***' : this.sanitizeValue(val);
      }

      return sanitizedObj;
    }

    return value;
  }
}

/**
 * UUID検証パイプ
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform {
  private readonly uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: unknown, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: metadata.data ?? 'uuid',
            value: value,
            constraints: [ValidationMessages.IS_UUID],
          },
        ],
        'UuidValidationPipe',
      );
    }

    if (!this.uuidPattern.test(value)) {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: metadata.data ?? 'uuid',
            value: `***-${value.slice(-8)}`,
            constraints: [ValidationMessages.IS_UUID],
          },
        ],
        'UuidValidationPipe',
      );
    }

    return value;
  }
}

/**
 * 正の整数検証パイプ
 */
@Injectable()
export class PositiveIntPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): number {
    const num = Number(value);

    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: metadata.data ?? 'number',
            value: value,
            constraints: [ValidationErrorMessages.IS_POSITIVE_INT],
          },
        ],
        'PositiveIntPipe',
      );
    }

    return num;
  }
}

/**
 * オプショナル正の整数検証パイプ
 */
@Injectable()
export class OptionalPositiveIntPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const num = Number(value);

    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: metadata.data ?? 'number',
            value: value,
            constraints: [ValidationErrorMessages.IS_POSITIVE_INT],
          },
        ],
        'OptionalPositiveIntPipe',
      );
    }

    return num;
  }
}

/**
 * 文字列トリムパイプ
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  constructor(private readonly allowEmpty = false) {}

  transform(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();

    if (!this.allowEmpty && trimmed === '') {
      return undefined;
    }

    return trimmed;
  }
}
