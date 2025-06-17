import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { AppConstants } from '@common/constants/app.constants';
import { ValidationMessages } from '@common/constants/validation.constants';

/**
 * ページネーション用クエリパラメータDTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ページ番号（1から開始）',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_INT })
  @Min(1, { message: 'ページ番号は1以上である必要があります' })
  @Transform(({ value }: { value: unknown }) => {
    // 数値変換時の安全性確保
    if (typeof value === 'number') {
      return Math.max(1, Math.floor(value));
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    }
    return 1;
  })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'ページごとの表示件数',
    minimum: AppConstants.MIN_PAGE_SIZE,
    maximum: AppConstants.MAX_PAGE_SIZE,
    default: AppConstants.DEFAULT_PAGE_SIZE,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_INT })
  @Min(AppConstants.MIN_PAGE_SIZE, {
    message: `表示件数は${AppConstants.MIN_PAGE_SIZE}以上である必要があります`,
  })
  @Max(AppConstants.MAX_PAGE_SIZE, {
    message: `表示件数は${AppConstants.MAX_PAGE_SIZE}以下である必要があります`,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'number') {
      if (value < AppConstants.MIN_PAGE_SIZE) {
        return AppConstants.DEFAULT_PAGE_SIZE;
      }
      if (value > AppConstants.MAX_PAGE_SIZE) {
        return AppConstants.MAX_PAGE_SIZE;
      }
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < AppConstants.MIN_PAGE_SIZE) {
        return AppConstants.DEFAULT_PAGE_SIZE;
      }
      if (num > AppConstants.MAX_PAGE_SIZE) {
        return AppConstants.MAX_PAGE_SIZE;
      }
      return num;
    }
    return AppConstants.DEFAULT_PAGE_SIZE;
  })
  limit: number = AppConstants.DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'ソートフィールド',
    default: AppConstants.DEFAULT_SORT_FIELD,
    example: 'created_at',
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Transform(({ value }: { value: unknown }) => {
    // SQLインジェクション対策: 英数字・アンダースコアのみ許可
    if (typeof value !== 'string') {
      return AppConstants.DEFAULT_SORT_FIELD;
    }
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
    return sanitized || AppConstants.DEFAULT_SORT_FIELD;
  })
  sortBy: string = AppConstants.DEFAULT_SORT_FIELD;

  @ApiPropertyOptional({
    description: 'ソート順序',
    enum: AppConstants.ALLOWED_SORT_ORDERS,
    default: AppConstants.DEFAULT_SORT_ORDER,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(AppConstants.ALLOWED_SORT_ORDERS, {
    message: `ソート順序は ${AppConstants.ALLOWED_SORT_ORDERS.join(', ')} のいずれかである必要があります`,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !AppConstants.ALLOWED_SORT_ORDERS.includes(value as never)) {
      return AppConstants.DEFAULT_SORT_ORDER;
    }
    return value;
  })
  order: (typeof AppConstants.ALLOWED_SORT_ORDERS)[number] = AppConstants.DEFAULT_SORT_ORDER;

  /**
   * SQLクエリ用のオフセット値を計算
   */
  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * 次のページ番号を取得
   */
  getNextPage(): number {
    return this.page + 1;
  }

  /**
   * 前のページ番号を取得
   */
  getPreviousPage(): number {
    return Math.max(1, this.page - 1);
  }

  /**
   * 指定された総件数から総ページ数を計算
   */
  getTotalPages(totalCount: number): number {
    return Math.ceil(totalCount / this.limit);
  }

  /**
   * 現在のページが最初のページかどうか
   */
  isFirstPage(): boolean {
    return this.page === 1;
  }

  /**
   * 現在のページが最後のページかどうか
   */
  isLastPage(totalCount: number): boolean {
    return this.page >= this.getTotalPages(totalCount);
  }

  /**
   * ページネーション情報をプレーンオブジェクトとして取得
   */
  toPlainObject(): {
    page: number;
    limit: number;
    offset: number;
    sortBy: string;
    order: string;
  } {
    return {
      page: this.page,
      limit: this.limit,
      offset: this.offset,
      sortBy: this.sortBy,
      order: this.order,
    };
  }
}

/**
 * タスク専用ページネーションDTO
 * ソートフィールドをタスク用に制限
 */
export class TaskPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ソートフィールド（タスク用）',
    enum: AppConstants.TASK_SORTABLE_FIELDS,
    default: AppConstants.DEFAULT_SORT_FIELD,
    example: 'created_at',
  })
  @IsOptional()
  @IsEnum(AppConstants.TASK_SORTABLE_FIELDS, {
    message: `ソートフィールドは ${AppConstants.TASK_SORTABLE_FIELDS.join(', ')} のいずれかである必要があります`,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !AppConstants.TASK_SORTABLE_FIELDS.includes(value as never)) {
      return AppConstants.DEFAULT_SORT_FIELD;
    }
    return value;
  })
  override sortBy: (typeof AppConstants.TASK_SORTABLE_FIELDS)[number] = AppConstants.DEFAULT_SORT_FIELD;
}

/**
 * タグ専用ページネーションDTO
 * ソートフィールドをタグ用に制限
 */
export class TagPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ソートフィールド（タグ用）',
    enum: AppConstants.TAG_SORTABLE_FIELDS,
    default: AppConstants.DEFAULT_SORT_FIELD,
    example: 'created_at',
  })
  @IsOptional()
  @IsEnum(AppConstants.TAG_SORTABLE_FIELDS, {
    message: `ソートフィールドは ${AppConstants.TAG_SORTABLE_FIELDS.join(', ')} のいずれかである必要があります`,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !AppConstants.TAG_SORTABLE_FIELDS.includes(value as never)) {
      return AppConstants.DEFAULT_SORT_FIELD;
    }
    return value;
  })
  override sortBy: (typeof AppConstants.TAG_SORTABLE_FIELDS)[number] = AppConstants.DEFAULT_SORT_FIELD;
}

/**
 * ページネーション検索結果のメタデータ
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: '現在のページ番号',
    example: 1,
    minimum: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'ページごとの表示件数',
    example: 20,
    minimum: 1,
  })
  limit!: number;

  @ApiProperty({
    description: '総件数',
    example: 150,
    minimum: 0,
  })
  totalCount!: number;

  @ApiProperty({
    description: '総ページ数',
    example: 8,
    minimum: 0,
  })
  totalPages!: number;

  @ApiProperty({
    description: '前のページが存在するか',
    example: false,
  })
  hasPreviousPage!: boolean;

  @ApiProperty({
    description: '次のページが存在するか',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'ソートフィールド',
    example: 'created_at',
  })
  sortBy!: string;

  @ApiProperty({
    description: 'ソート順序',
    example: 'desc',
  })
  order!: string;

  constructor(pagination: PaginationQueryDto, totalCount: number) {
    this.page = pagination.page;
    this.limit = pagination.limit;
    this.totalCount = totalCount;
    this.totalPages = pagination.getTotalPages(totalCount);
    this.hasPreviousPage = !pagination.isFirstPage();
    this.hasNextPage = !pagination.isLastPage(totalCount);
    this.sortBy = pagination.sortBy;
    this.order = pagination.order;
  }
}

/**
 * ページネーション付きレスポンス用のベースクラス
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'データ配列',
    isArray: true,
  })
  data!: T[];

  @ApiProperty({
    description: 'ページネーション情報',
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }

  /**
   * ページネーション付きレスポンスを作成
   */
  static create<T>(data: T[], pagination: PaginationQueryDto, totalCount: number): PaginatedResponseDto<T> {
    const meta = new PaginationMetaDto(pagination, totalCount);
    return new PaginatedResponseDto(data, meta);
  }
}
