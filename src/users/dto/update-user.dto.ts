import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

import { ValidationLimits, ValidationMessages, ValidationOptions } from '@common/constants/validation.constants';

/**
 * ユーザープロフィール更新DTO
 */
export class UpdateUserProfileDto {
  @ApiProperty({
    description: '表示名',
    example: '山田花子',
    minLength: ValidationLimits.DISPLAY_NAME_MIN_LENGTH,
    maxLength: ValidationLimits.DISPLAY_NAME_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.DISPLAY_NAME_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.DISPLAY_NAME_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationOptions.DISPLAY_NAME.pattern, { message: ValidationMessages.DISPLAY_NAME_INVALID_CHARS })
  displayName?: string;

  @ApiProperty({
    description: 'アバター画像URL',
    example: 'https://example.com/new-avatar.jpg',
    maxLength: ValidationLimits.AVATAR_URL_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: ValidationMessages.IS_URL })
  @MaxLength(ValidationLimits.AVATAR_URL_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  avatarUrl?: string;
}

/**
 * パスワード変更DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '現在のパスワード',
    example: 'CurrentPass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  currentPassword!: string;

  @ApiProperty({
    description: '新しいパスワード（英数字を含む8文字以上）',
    example: 'NewSecurePass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationOptions.PASSWORD.pattern, { message: ValidationMessages.PASSWORD_WEAK })
  newPassword!: string;

  @ApiProperty({
    description: '新しいパスワード（確認用）',
    example: 'NewSecurePass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  confirmPassword!: string;
}

/**
 * メールアドレス変更DTO
 */
export class ChangeEmailDto {
  @ApiProperty({
    description: '新しいメールアドレス',
    example: 'newemail@example.com',
    format: 'email',
    maxLength: ValidationLimits.EMAIL_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MaxLength(ValidationLimits.EMAIL_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Matches(ValidationOptions.EMAIL.pattern, { message: ValidationMessages.IS_EMAIL })
  newEmail!: string;

  @ApiProperty({
    description: '現在のパスワード（本人確認用）',
    example: 'CurrentPass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  currentPassword!: string;
}

/**
 * アカウント無効化DTO
 */
export class DeactivateAccountDto {
  @ApiProperty({
    description: '現在のパスワード（本人確認用）',
    example: 'CurrentPass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.PASSWORD_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  currentPassword!: string;

  @ApiProperty({
    description: '無効化の理由（オプション）',
    example: 'サービスを使用しなくなったため',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MaxLength(500, { message: ValidationMessages.MAX_LENGTH })
  reason?: string;
}
