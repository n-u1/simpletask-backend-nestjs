import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
 * タスク作成用DTO
 * 新規タスクを作成する際に必要な情報を定義
 */
export class CreateTaskDto {
  @ApiProperty({
    description: 'タスクタイトル',
    example: 'APIドキュメント作成',
    minLength: ValidationLimits.TASK_TITLE_MIN_LENGTH,
    maxLength: ValidationLimits.TASK_TITLE_MAX_LENGTH,
  })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY })
  @IsString({ message: ValidationMessages.IS_STRING })
  @MinLength(ValidationLimits.TASK_TITLE_MIN_LENGTH, { message: ValidationMessages.MIN_LENGTH })
  @MaxLength(ValidationLimits.TASK_TITLE_MAX_LENGTH, { message: ValidationMessages.MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

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
      return trimmed === '' ? undefined : trimmed;
    }
    return value;
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'タスクステータス',
    enum: TaskStatus,
    example: TaskStatus.TODO,
    default: TaskStatus.TODO,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: ValidationMessages.IS_ENUM })
  status?: TaskStatus = TaskStatus.TODO;

  @ApiPropertyOptional({
    description: 'タスク優先度',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: ValidationMessages.IS_ENUM })
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiPropertyOptional({
    description: 'タスクの期限日時（ISO 8601形式）',
    example: '2025-06-30T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @ValidateIf((o, value) => value !== undefined && value !== null && value !== '')
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') {
      return undefined;
    }

    // 日時文字列を Date オブジェクトに変換して検証
    let dateValue: string | number | Date;
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      dateValue = value;
    } else {
      // オブジェクトの場合はエラーとして扱う
      return value; // バリデーターでエラーになる
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return value; // 無効な日時はバリデーターに任せる
    }

    return date.toISOString();
  })
  dueDate?: string;

  @ApiPropertyOptional({
    description: '表示順序（小さい値ほど上位に表示）',
    example: 1,
    minimum: ValidationLimits.TASK_POSITION_MIN,
    maximum: ValidationLimits.TASK_POSITION_MAX,
    default: ValidationLimits.TASK_POSITION_MIN,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_INT })
  @Min(ValidationLimits.TASK_POSITION_MIN, { message: ValidationMessages.MIN })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return ValidationLimits.TASK_POSITION_MIN;
    }

    const num = Number(value);
    if (isNaN(num)) {
      return ValidationLimits.TASK_POSITION_MIN;
    }

    if (num < ValidationLimits.TASK_POSITION_MIN) {
      return ValidationLimits.TASK_POSITION_MIN;
    }
    if (num > ValidationLimits.TASK_POSITION_MAX) {
      return ValidationLimits.TASK_POSITION_MAX;
    }

    return Math.floor(num);
  })
  position?: number = ValidationLimits.TASK_POSITION_MIN;

  @ApiPropertyOptional({
    description: '関連付けるタグIDの配列',
    example: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011'],
    type: [String],
    maxItems: ValidationLimits.TAG_IDS_MAX_COUNT,
  })
  @IsOptional()
  @IsArray({ message: 'タグIDは配列で指定してください' })
  @IsUUID(4, { each: true, message: '有効なタグIDを指定してください' })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) {
      return [];
    }

    // 重複を除去し、空文字列やnullを除外
    const validIds = value.filter((id: unknown): id is string => {
      return typeof id === 'string' && id.trim() !== '';
    });
    const uniqueIds = [...new Set(validIds)];

    // 最大件数制限
    return uniqueIds.slice(0, ValidationLimits.TAG_IDS_MAX_COUNT);
  })
  tagIds?: string[] = [];

  /**
   * DTOの妥当性を追加でチェック
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // 期限日が過去でないかチェック（警告レベル）
    if (this.dueDate) {
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

    return errors;
  }

  /**
   * 作成用のプレーンオブジェクトに変換
   */
  toCreateObject(): {
    title: string;
    description?: string | undefined;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date | undefined;
    position: number;
    tagIds: string[];
  } {
    return {
      title: this.title,
      description: this.description,
      status: this.status ?? TaskStatus.TODO,
      priority: this.priority ?? TaskPriority.MEDIUM,
      dueDate: this.dueDate ? new Date(this.dueDate) : undefined,
      position: this.position ?? ValidationLimits.TASK_POSITION_MIN,
      tagIds: this.tagIds ?? [],
    };
  }
}
