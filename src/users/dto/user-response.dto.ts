import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { User } from '@/users/entities/user.entity';
import { ValidationMessages } from '@common/constants/validation.constants';

/**
 * ユーザー情報レスポンスDTO
 * クライアント（フロントエンド）に返すユーザー情報の形式を定義
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @Expose()
  email!: string;

  @ApiProperty({
    description: '表示名',
    example: '山田太郎',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @Expose()
  displayName!: string;

  @ApiProperty({
    description: 'アバター画像URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  avatarUrl!: string | null;

  @ApiProperty({
    description: 'アカウント有効フラグ',
    example: true,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'メール認証完了フラグ',
    example: true,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isVerified!: boolean;

  @ApiProperty({
    description: '最終ログイン時刻',
    example: '2025-06-02T10:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  lastLoginAt!: Date | null;

  @ApiProperty({
    description: 'アカウント作成日時',
    example: '2025-06-02T10:00:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'アカウント更新日時',
    example: '2025-06-02T10:00:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  updatedAt!: Date;

  // セキュリティ上の理由で除外するフィールド
  @Exclude()
  passwordHash?: string;

  @Exclude()
  failedLoginAttempts?: number;

  @Exclude()
  lockedUntil?: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * User エンティティから UserResponseDto を作成
   */
  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
