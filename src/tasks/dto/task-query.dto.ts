import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '@common/constants/app.constants';
import { ValidationMessages } from '@common/constants/validation.constants';
import { TaskPaginationQueryDto } from '@common/dto/pagination.dto';

/**
 * タスク検索・フィルタリング用クエリDTO
 * ページネーション + フィルタリング条件を定義
 */
export class TaskQueryDto extends TaskPaginationQueryDto {
  @ApiPropertyOptional({
    description: '検索キーワード（タイトル・説明を対象）',
    example: 'ドキュメント',
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
    description: 'フィルタ対象のステータス（複数選択可）',
    enum: TaskStatus,
    isArray: true,
    example: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  })
  @IsOptional()
  @IsArray({ message: 'ステータスは配列で指定してください' })
  @IsEnum(TaskStatus, { each: true, message: ValidationMessages.IS_ENUM })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      // カンマ区切りの文字列を配列に変換
      return value
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    }
    if (Array.isArray(value)) {
      return value.filter((v: unknown): v is string => v !== null && v !== undefined && typeof v === 'string');
    }
    return value;
  })
  statuses?: TaskStatus[];

  @ApiPropertyOptional({
    description: 'フィルタ対象の優先度（複数選択可）',
    enum: TaskPriority,
    isArray: true,
    example: [TaskPriority.HIGH, TaskPriority.URGENT],
  })
  @IsOptional()
  @IsArray({ message: '優先度は配列で指定してください' })
  @IsEnum(TaskPriority, { each: true, message: ValidationMessages.IS_ENUM })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    }
    if (Array.isArray(value)) {
      return value.filter((v: unknown): v is string => v !== null && v !== undefined && typeof v === 'string');
    }
    return value;
  })
  priorities?: TaskPriority[];

  @ApiPropertyOptional({
    description: 'フィルタ対象のタグID（複数選択可）',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440010'],
  })
  @IsOptional()
  @IsArray({ message: 'タグIDは配列で指定してください' })
  @IsUUID(4, { each: true, message: '有効なタグIDを指定してください' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    }
    if (Array.isArray(value)) {
      return value.filter((v: unknown): v is string => v !== null && v !== undefined && typeof v === 'string');
    }
    return value;
  })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: '期限日フィルタ開始日（この日以降）',
    example: '2025-06-01T00:00:00.000Z',
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
  dueDateFrom?: string;

  @ApiPropertyOptional({
    description: '期限日フィルタ終了日（この日まで）',
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
  dueDateTo?: string;

  @ApiPropertyOptional({
    description: '期限切れタスクのみ表示',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  overdue?: boolean;

  @ApiPropertyOptional({
    description: '完了タスクを含めるかどうか',
    example: false,
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
  includeCompleted?: boolean = true;

  @ApiPropertyOptional({
    description: 'アーカイブタスクを含めるかどうか',
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
  includeArchived?: boolean = false;

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
    statuses?: TaskStatus[] | undefined;
    priorities?: TaskPriority[] | undefined;
    tagIds?: string[] | undefined;
    dueDateFrom?: Date | undefined;
    dueDateTo?: Date | undefined;
    overdue?: boolean | undefined;
    includeCompleted: boolean;
    includeArchived: boolean;
    createdFrom?: Date | undefined;
    createdTo?: Date | undefined;
  } {
    return {
      search: this.search,
      statuses: this.statuses,
      priorities: this.priorities,
      tagIds: this.tagIds,
      dueDateFrom: this.dueDateFrom ? new Date(this.dueDateFrom) : undefined,
      dueDateTo: this.dueDateTo ? new Date(this.dueDateTo) : undefined,
      overdue: this.overdue,
      includeCompleted: this.includeCompleted ?? true,
      includeArchived: this.includeArchived ?? false,
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

    // 配列フィルタの存在チェック
    if (this.statuses && this.statuses.length > 0) {
      return true;
    }
    if (this.priorities && this.priorities.length > 0) {
      return true;
    }
    if (this.tagIds && this.tagIds.length > 0) {
      return true;
    }

    // 日時フィルタの存在チェック
    if (this.dueDateFrom) {
      return true;
    }
    if (this.dueDateTo) {
      return true;
    }
    if (this.createdFrom) {
      return true;
    }
    if (this.createdTo) {
      return true;
    }

    // 真偽値フィルタのチェック
    if (this.overdue === true) {
      return true;
    }
    if (this.includeCompleted === false) {
      return true;
    }
    if (this.includeArchived === true) {
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
    if (this.statuses?.length) {
      filters.push(`ステータス: ${this.statuses.join(', ')}`);
    }
    if (this.priorities?.length) {
      filters.push(`優先度: ${this.priorities.join(', ')}`);
    }
    if (this.tagIds?.length) {
      filters.push(`タグ: ${this.tagIds.length}個`);
    }
    if (this.dueDateFrom) {
      filters.push(`期限日(開始): ${this.dueDateFrom}`);
    }
    if (this.dueDateTo) {
      filters.push(`期限日(終了): ${this.dueDateTo}`);
    }
    if (this.overdue) {
      filters.push('期限切れのみ');
    }
    if (this.includeCompleted === false) {
      filters.push('完了タスクを除外');
    }
    if (this.includeArchived === true) {
      filters.push('アーカイブタスクを含む');
    }
    if (this.createdFrom) {
      filters.push(`作成日(開始): ${this.createdFrom}`);
    }
    if (this.createdTo) {
      filters.push(`作成日(終了): ${this.createdTo}`);
    }

    return filters;
  }
}
