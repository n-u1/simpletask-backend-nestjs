import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { Tag } from '@/tags/entities/tag.entity';
import { ValidationMessages } from '@common/constants/validation.constants';

/**
 * タグ情報レスポンスDTO
 * クライアントに返すタグ情報の形式を定義
 */
export class TagResponseDto {
  @ApiProperty({
    description: 'タグID',
    example: '550e8400-e29b-41d4-a716-446655440010',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'タグの所有者ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'タグ名',
    example: 'フロントエンド',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'タグの色（カラーコード）',
    example: '#3B82F6',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  color!: string;

  @ApiPropertyOptional({
    description: 'タグの説明',
    example: 'フロントエンド開発に関するタスク',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  description!: string | null;

  @ApiProperty({
    description: 'タグの有効フラグ',
    example: true,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'タグ作成日時',
    example: '2025-06-01T10:00:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'タグ更新日時',
    example: '2025-06-02T15:30:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  updatedAt!: Date;

  constructor(partial: Partial<TagResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Tag エンティティから TagResponseDto を作成
   */
  static fromEntity(tag: Tag): TagResponseDto {
    return new TagResponseDto({
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      description: tag.description ?? null,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
  }

  /**
   * Tag エンティティの配列から TagResponseDto の配列を作成
   */
  static fromEntityArray(tags: Tag[]): TagResponseDto[] {
    return tags.map(tag => TagResponseDto.fromEntity(tag));
  }
}

/**
 * タグ一覧レスポンス用の軽量DTO
 * 一覧表示で必要最小限の情報のみ含む
 */
export class TagListItemDto {
  @ApiProperty({
    description: 'タグID',
    example: '550e8400-e29b-41d4-a716-446655440010',
    format: 'uuid',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'タグ名',
    example: 'フロントエンド',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'タグの色（カラーコード）',
    example: '#3B82F6',
  })
  @Expose()
  color!: string;

  @ApiPropertyOptional({
    description: 'タグの説明',
    example: 'フロントエンド開発に関するタスク',
    nullable: true,
  })
  @Expose()
  description!: string | null;

  @ApiProperty({
    description: 'タグの有効フラグ',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'タグ作成日時',
    example: '2025-06-01T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<TagListItemDto>) {
    Object.assign(this, partial);
  }

  /**
   * Tag エンティティから TagListItemDto を作成
   */
  static fromEntity(tag: Tag): TagListItemDto {
    return new TagListItemDto({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description ?? null,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
    });
  }

  /**
   * Tag エンティティの配列から TagListItemDto の配列を作成
   */
  static fromEntityArray(tags: Tag[]): TagListItemDto[] {
    return tags.map(tag => TagListItemDto.fromEntity(tag));
  }
}
