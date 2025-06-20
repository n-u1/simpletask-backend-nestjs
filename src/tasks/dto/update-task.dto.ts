import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '@common/constants/app.constants';
import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { ValidationLimits, ValidationMessages } from '@common/constants/validation.constants';

/**
 * タスク更新用DTO
 * 既存のタスクを更新する際に必要な情報を定義
 * 全てのフィールドがオプショナル
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'タスクタイトル',
    example: 'APIドキュメント作成（更新版）',
    minLength: ValidationLimits.TASK_TITLE_MIN_LENGTH,
    maxLength: ValidationLimits.TASK_TITLE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.TASK_TITLE_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.TASK_TITLE_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    description: 'タスクの詳細説明',
    example: 'OpenAPI仕様書を作成し、エンドポイントの詳細を文書化する',
    maxLength: ValidationLimits.TASK_DESCRIPTION_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @MaxLength(ValidationLimits.TASK_DESCRIPTION_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed; // 空文字列をnullに変換
    }
    return value;
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'タスクステータス',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: ValidationMessages.IS_ENUM })
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'タスク優先度',
    enum: TaskPriority,
    example: TaskPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: ValidationMessages.IS_ENUM })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'タスクの期限日時（ISO 8601形式）',
    example: '2025-07-15T23:59:59.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') {
      return null;
    }

    let dateValue: string | number | Date;
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      dateValue = value;
    } else {
      return value; // バリデーターでエラーになる
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return value; // 無効な日時はバリデーターに任せる
    }

    return date.toISOString();
  })
  dueDate?: string | null;

  @ApiPropertyOptional({
    description: '表示順序（小さい値ほど上位に表示）',
    example: 5,
    minimum: ValidationLimits.TASK_POSITION_MIN,
    maximum: ValidationLimits.TASK_POSITION_MAX,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_INT })
  @Min(ValidationLimits.TASK_POSITION_MIN, { message: ValidationMessages.MIN })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined; // 更新では元の値を保持
    }

    const num = Number(value);
    if (isNaN(num)) {
      return undefined;
    }

    // 範囲チェック
    if (num < ValidationLimits.TASK_POSITION_MIN) {
      return ValidationLimits.TASK_POSITION_MIN;
    }
    if (num > ValidationLimits.TASK_POSITION_MAX) {
      return ValidationLimits.TASK_POSITION_MAX;
    }

    return Math.floor(num);
  })
  position?: number;

  @ApiPropertyOptional({
    description: '関連付けるタグIDの配列',
    example: ['550e8400-e29b-41d4-a716-446655440010'],
    type: [String],
    maxItems: ValidationLimits.TAG_IDS_MAX_COUNT,
  })
  @IsOptional()
  @IsArray({ message: 'タグIDは配列で指定してください' })
  @IsUUID(4, { each: true, message: '有効なタグIDを指定してください' })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) {
      return undefined;
    }

    // 重複を除去し、空文字列やnullを除外
    const validIds = value.filter((id: unknown): id is string => {
      return typeof id === 'string' && id.trim() !== '';
    });
    const uniqueIds = [...new Set(validIds)];

    // 最大件数制限
    return uniqueIds.slice(0, ValidationLimits.TAG_IDS_MAX_COUNT);
  })
  tagIds?: string[];

  @ApiPropertyOptional({
    description: 'タスクを完了としてマークするかどうか',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  markCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'タスクをアーカイブするかどうか',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  markArchived?: boolean;

  /**
   * DTOの妥当性を追加でチェック
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // 期限日が過去でないかチェック（警告レベル）
    if (this.dueDate && this.dueDate !== null) {
      const dueDate = new Date(this.dueDate);
      const now = new Date();

      // 1分の余裕を持たせる（時差・クロックズレ考慮）
      if (dueDate.getTime() < now.getTime() - 60000) {
        errors.push(ValidationErrorMessages.DATE_IN_PAST);
      }

      // 過度に未来の日付をチェック（10年後まで）
      const maxFuture = new Date();
      maxFuture.setFullYear(now.getFullYear() + 10);
      if (dueDate > maxFuture) {
        errors.push(ValidationErrorMessages.DATE_TOO_FAR);
      }
    }

    // 相互排他的なフラグのチェック
    if (this.markCompleted && this.markArchived) {
      errors.push(ValidationErrorMessages.TASK_COMPLETE_AND_ARCHIVE_CONFLICT);
    }

    // ステータスとフラグの整合性チェック
    if (this.markCompleted && this.status && this.status !== TaskStatus.DONE) {
      errors.push(ValidationErrorMessages.TASK_COMPLETE_STATUS_MISMATCH);
    }

    if (this.markArchived && this.status && this.status !== TaskStatus.ARCHIVED) {
      errors.push(ValidationErrorMessages.TASK_ARCHIVE_STATUS_MISMATCH);
    }

    return errors;
  }

  /**
   * 更新用のプレーンオブジェクトに変換
   */
  toUpdateObject(): {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    position?: number;
    tagIds?: string[];
    markCompleted?: boolean;
    markArchived?: boolean;
  } {
    const updateData: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date | null;
      position?: number;
      tagIds?: string[];
      markCompleted?: boolean;
      markArchived?: boolean;
    } = {};

    if (this.title !== undefined) {
      updateData.title = this.title;
    }
    if (this.description !== undefined) {
      updateData.description = this.description;
    }
    if (this.status !== undefined) {
      updateData.status = this.status;
    }
    if (this.priority !== undefined) {
      updateData.priority = this.priority;
    }
    if (this.dueDate !== undefined) {
      updateData.dueDate = this.dueDate ? new Date(this.dueDate) : null;
    }
    if (this.position !== undefined) {
      updateData.position = this.position;
    }
    if (this.tagIds !== undefined) {
      updateData.tagIds = this.tagIds;
    }
    if (this.markCompleted !== undefined) {
      updateData.markCompleted = this.markCompleted;
    }
    if (this.markArchived !== undefined) {
      updateData.markArchived = this.markArchived;
    }

    return updateData;
  }

  /**
   * 更新対象のフィールドがあるかチェック
   */
  hasUpdates(): boolean {
    return !!(
      this.title !== undefined ||
      this.description !== undefined ||
      this.status !== undefined ||
      this.priority !== undefined ||
      this.dueDate !== undefined ||
      this.position !== undefined ||
      this.tagIds !== undefined ||
      this.markCompleted !== undefined ||
      this.markArchived !== undefined
    );
  }
}
