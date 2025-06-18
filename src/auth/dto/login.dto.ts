import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ValidationLimits, ValidationMessages } from '@common/constants/validation.constants';

/**
 * ログイン用DTO
 */
export class LoginDto {
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
    description: 'パスワード',
    example: 'SecurePass123',
    minLength: ValidationLimits.PASSWORD_MIN_LENGTH,
    maxLength: ValidationLimits.PASSWORD_MAX_LENGTH,
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @MaxLength(ValidationLimits.PASSWORD_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  password!: string;
}
