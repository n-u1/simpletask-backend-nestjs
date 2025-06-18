import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

import { ValidationLimits, ValidationMessages, ValidationOptions } from '@common/constants/validation.constants';

/**
 * ユーザー登録用DTO
 */
export class RegisterDto {
  @ApiProperty({
    description: 'メールアドレス',
    example: 'user@example.com',
    format: 'email',
    maxLength: ValidationLimits.EMAIL_MAX_LENGTH,
  })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @MaxLength(ValidationLimits.EMAIL_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  email!: string;

  @ApiProperty({
    description: 'パスワード（英数字を含む8文字以上）',
    example: 'SecurePass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationOptions.PASSWORD.pattern, { message: ValidationMessages.PASSWORD_WEAK })
  password!: string;

  @ApiProperty({
    description: '表示名',
    example: '山田太郎',
    minLength: ValidationLimits.DISPLAY_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.DISPLAY_NAME_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @MinLength(ValidationLimits.DISPLAY_NAME_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.DISPLAY_NAME_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationOptions.DISPLAY_NAME.pattern, { message: ValidationMessages.DISPLAY_NAME_INVALID_CHARS })
  displayName!: string;

  @ApiProperty({
    description: 'アバターURL（オプション）',
    example: 'https://example.com/avatar.jpg',
    required: false,
    maxLength: ValidationLimits.AVATAR_URL_MAX_LENGTH,
  })
  @IsOptional()
  @IsUrl({}, { message: ValidationMessages.IS_URL })
  @MaxLength(ValidationLimits.AVATAR_URL_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  avatarUrl?: string;
}
