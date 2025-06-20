import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { TagConstants } from '@common/constants/app.constants';
import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { ValidationLimits, ValidationMessages, ValidationPatterns } from '@common/constants/validation.constants';

/**
 * タグ作成用DTO
 * 新しいタグを作成する際に必要な情報を定義
 */
export class CreateTagDto {
  @ApiProperty({
    description: 'タグ名',
    example: 'フロントエンド',
    minLength: ValidationLimits.TAG_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.TAG_NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.TAG_NAME_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.TAG_NAME_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationPatterns.TAG_NAME, { message: ValidationErrorMessages.TAG_NAME_WHITESPACE_ONLY })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({
    description: 'タグの色（カラーコード #RRGGBB形式）',
    example: '#3B82F6',
    pattern: '^#[0-9A-Fa-f]{6}$',
    default: TagConstants.DEFAULT_COLOR,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Matches(ValidationPatterns.COLOR_CODE, { message: ValidationMessages.COLOR_CODE_INVALID })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim().toUpperCase();
      return trimmed === '' ? TagConstants.DEFAULT_COLOR : trimmed;
    }
    return value;
  })
  color?: string = TagConstants.DEFAULT_COLOR;

  @ApiPropertyOptional({
    description: 'タグの説明',
    example: 'フロントエンド開発に関するタスク',
    maxLength: ValidationLimits.TAG_DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MaxLength(ValidationLimits.TAG_DESCRIPTION_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return value;
  })
  description?: string;

  /**
   * DTOの妥当性を追加でチェック
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // カラーコードがプリセットにある場合の推奨
    if (this.color && !TagConstants.PRESET_COLORS.includes(this.color as (typeof TagConstants.PRESET_COLORS)[number])) {
      // エラーではなく、カスタムカラーとして許可（ワーニングレベル）
    }

    // タグ名の特殊文字チェック
    if (this.name && this.name.length > 0) {
      const specialChars = /[<>]/g;
      if (specialChars.test(this.name)) {
        errors.push(ValidationErrorMessages.TAG_NAME_CONTAINS_ANGLE_BRACKETS);
      }
    }

    return errors;
  }

  /**
   * 作成用のプレーンオブジェクトに変換
   */
  toCreateObject(): {
    name: string;
    color: string;
    description?: string | undefined;
  } {
    return {
      name: this.name,
      color: this.color ?? TagConstants.DEFAULT_COLOR,
      description: this.description,
    };
  }

  /**
   * カラーコードが有効かチェック
   */
  isValidColor(): boolean {
    if (!this.color) {
      return true;
    } // デフォルト値が使用される
    return ValidationPatterns.COLOR_CODE.test(this.color);
  }

  /**
   * プリセットカラーかどうかチェック
   */
  isPresetColor(): boolean {
    return this.color
      ? TagConstants.PRESET_COLORS.includes(this.color as (typeof TagConstants.PRESET_COLORS)[number])
      : true;
  }
}
