import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { ValidationMessages } from '@common/constants/validation.constants';
import { TagPaginationQueryDto } from '@common/dto/pagination.dto';

/**
 * タグ検索・フィルタリング用クエリDTO
 * ページネーション + フィルタリング条件を定義
 */
export class TagQueryDto extends TagPaginationQueryDto {
  @ApiPropertyOptional({
    description: '検索キーワード（タグ名・説明を対象）',
    example: 'フロント',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(1, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    description: 'フィルタ対象の色（複数選択可）',
    type: [String],
    example: ['#3B82F6', '#EF4444'],
  })
  @IsOptional()
  @IsArray({ message: '色は配列で指定してください' })
  @IsString({ each: true, message: '有効な色コードを指定してください' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      // カンマ区切りの文字列を配列に変換
      return value
        .split(',')
        .map(v => v.trim().toUpperCase())
        .filter(v => v);
    }
    if (Array.isArray(value)) {
      return value
        .filter((v: unknown): v is string => v !== null && v !== undefined && typeof v === 'string')
        .map(v => v.trim().toUpperCase())
        .filter(v => v);
    }
    return value;
  })
  colors?: string[];

  @ApiPropertyOptional({
    description: '有効なタグのみ表示',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeActive?: boolean = true;

  @ApiPropertyOptional({
    description: '無効なタグも含めるかどうか',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeInactive?: boolean = false;

  @ApiPropertyOptional({
    description: '作成日フィルタ開始日',
    example: '2025-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') {
      return undefined;
    }
    let dateValue: string | number | Date;
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      dateValue = value;
    } else {
      return value;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? value : date.toISOString();
  })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: '作成日フィルタ終了日',
    example: '2025-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') {
      return undefined;
    }
    let dateValue: string | number | Date;
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      dateValue = value;
    } else {
      return value;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? value : date.toISOString();
  })
  createdTo?: string;

  /**
   * 検索・フィルタ条件を WHERE 句用のオブジェクトに変換
   */
  toWhereConditions(): {
    search?: string | undefined;
    colors?: string[] | undefined;
    includeActive: boolean;
    includeInactive: boolean;
    createdFrom?: Date | undefined;
    createdTo?: Date | undefined;
  } {
    return {
      search: this.search,
      colors: this.colors,
      includeActive: this.includeActive ?? true,
      includeInactive: this.includeInactive ?? false,
      createdFrom: this.createdFrom ? new Date(this.createdFrom) : undefined,
      createdTo: this.createdTo ? new Date(this.createdTo) : undefined,
    };
  }

  /**
   * アクティブなフィルタがあるかチェック
   */
  hasFilters(): boolean {
    // 検索キーワードの存在チェック
    if (this.search && this.search.length > 0) {
      return true;
    }

    // 色フィルタの存在チェック
    if (this.colors && this.colors.length > 0) {
      return true;
    }

    // 日時フィルタの存在チェック
    if (this.createdFrom) {
      return true;
    }
    if (this.createdTo) {
      return true;
    }

    // 特殊フィルタのチェック
    if (this.includeActive === false) {
      return true;
    }
    if (this.includeInactive === true) {
      return true;
    }

    return false;
  }

  /**
   * 検索用のサマリー情報を取得
   */
  getFilterSummary(): string[] {
    const filters: string[] = [];

    if (this.search) {
      filters.push(`検索: "${this.search}"`);
    }
    if (this.colors?.length) {
      filters.push(`色: ${this.colors.length}個`);
    }
    if (this.createdFrom) {
      filters.push(`作成日(開始): ${this.createdFrom}`);
    }
    if (this.createdTo) {
      filters.push(`作成日(終了): ${this.createdTo}`);
    }
    if (this.includeActive === false) {
      filters.push('有効タグを除外');
    }
    if (this.includeInactive === true) {
      filters.push('無効タグを含む');
    }

    return filters;
  }
}
