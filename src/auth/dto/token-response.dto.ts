import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

import { ValidationMessages } from '@common/constants/validation.constants';

/**
 * 認証されたユーザー情報（トークンレスポンス用）
 */
export class AuthUserDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  id!: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'user@example.com',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  email!: string;

  @ApiProperty({
    description: '表示名',
    example: '山田太郎',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  displayName!: string;

  @ApiProperty({
    description: 'アバターURL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  constructor(partial: Partial<AuthUserDto>) {
    Object.assign(this, partial);
  }
}

/**
 * トークンレスポンスDTO
 */
export class TokenResponseDto {
  @ApiProperty({
    description: 'アクセストークン',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  accessToken!: string;

  @ApiProperty({
    description: 'トークンタイプ',
    example: 'Bearer',
    enum: ['Bearer'],
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  tokenType!: 'Bearer';

  @ApiProperty({
    description: 'アクセストークンの有効期限（秒）',
    example: 1800,
    minimum: 1,
  })
  @IsInt({ message: ValidationMessages.IS_INT })
  @Min(1, { message: ValidationMessages.MIN })
  expiresIn!: number;

  @ApiProperty({
    description: 'リフレッシュトークン',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  refreshToken!: string;

  @ApiProperty({
    description: '認証されたユーザー情報',
    type: AuthUserDto,
  })
  user!: AuthUserDto;

  constructor(partial: Partial<TokenResponseDto>) {
    Object.assign(this, partial);
    if (partial.user) {
      this.user = new AuthUserDto(partial.user);
    }
  }
}

/**
 * リフレッシュトークンリクエストDTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'リフレッシュトークン',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  refreshToken!: string;
}
