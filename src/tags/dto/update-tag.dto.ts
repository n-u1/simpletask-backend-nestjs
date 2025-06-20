import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { ValidationLimits, ValidationMessages, ValidationPatterns } from '@common/constants/validation.constants';

/**
 * タグ更新用DTO
 * 既存のタグを更新する際に必要な情報を定義
 * 全てのフィールドがオプショナル
 */
export class UpdateTagDto {
  @ApiPropertyOptional({
    description: 'タグ名',
    example: 'バックエンド',
    minLength: ValidationLimits.TAG_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.TAG_NAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.TAG_NAME_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.TAG_NAME_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationPatterns.TAG_NAME, { message: ValidationErrorMessages.TAG_NAME_WHITESPACE_ONLY })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    description: 'タグの色（カラーコード #RRGGBB形式）',
    example: '#EF4444',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Matches(ValidationPatterns.COLOR_CODE, { message: ValidationMessages.COLOR_CODE_INVALID })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.trim().toUpperCase();
    }
    return value;
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'タグの説明',
    example: 'バックエンド開発に関するタスク',
    maxLength: ValidationLimits.TAG_DESCRIPTION_MAX_LENGTH,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MaxLength(ValidationLimits.TAG_DESCRIPTION_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'タグの有効フラグ',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isActive?: boolean;

  /**
   * DTOの妥当性を追加でチェック
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // タグ名の特殊文字チェック
    if (this.name && this.name.length > 0) {
      const specialChars = /[<>]/g;
      if (specialChars.test(this.name)) {
        errors.push(ValidationErrorMessages.TAG_NAME_CONTAINS_ANGLE_BRACKETS);
      }
    }

    // カラーコードの妥当性チェック
    if (this.color && !ValidationPatterns.COLOR_CODE.test(this.color)) {
      errors.push(ValidationErrorMessages.TAG_COLOR_INVALID);
    }

    return errors;
  }

  /**
   * 更新用のプレーンオブジェクトに変換
   */
  toUpdateObject(): {
    name?: string;
    color?: string;
    description?: string | null;
    isActive?: boolean;
  } {
    const updateData: {
      name?: string;
      color?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (this.name !== undefined) {
      updateData.name = this.name;
    }
    if (this.color !== undefined) {
      updateData.color = this.color;
    }
    if (this.description !== undefined) {
      updateData.description = this.description;
    }
    if (this.isActive !== undefined) {
      updateData.isActive = this.isActive;
    }

    return updateData;
  }

  /**
   * 更新対象のフィールドがあるかチェック
   */
  hasUpdates(): boolean {
    return !!(
      this.name !== undefined ||
      this.color !== undefined ||
      this.description !== undefined ||
      this.isActive !== undefined
    );
  }

  /**
   * カラーコードが変更されるかチェック
   */
  hasColorUpdate(): boolean {
    return this.color !== undefined;
  }

  /**
   * 名前が変更されるかチェック
   */
  hasNameUpdate(): boolean {
    return this.name !== undefined;
  }

  /**
   * アクティブ状態が変更されるかチェック
   */
  hasActiveStatusUpdate(): boolean {
    return this.isActive !== undefined;
  }
}
