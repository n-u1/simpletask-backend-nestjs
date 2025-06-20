import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

import { Task } from '@/tasks/entities/task.entity';
import { TaskPriority, TaskStatus } from '@common/constants/app.constants';
import { ValidationMessages } from '@common/constants/validation.constants';

/**
 * タグ情報のサブDTO
 * タスクに関連付けられたタグの情報
 */
export class TaskTagResponseDto {
  @ApiProperty({
    description: 'タグID',
    example: '550e8400-e29b-41d4-a716-446655440010',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  id!: string;

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

  @ApiProperty({
    description: 'タグの有効フラグ',
    example: true,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isActive!: boolean;

  constructor(partial: Partial<TaskTagResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * タスク情報レスポンスDTO
 * クライアントに返すタスク情報の形式を定義
 */
export class TaskResponseDto {
  @ApiProperty({
    description: 'タスクID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'タスクの所有者ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: ValidationMessages.IS_UUID })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'タスクタイトル',
    example: 'APIドキュメント作成',
  })
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  title!: string;

  @ApiPropertyOptional({
    description: 'タスクの詳細説明',
    example: 'OpenAPI仕様書を作成し、エンドポイントの詳細を文書化する',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING })
  @Expose()
  description!: string | null;

  @ApiProperty({
    description: 'タスクステータス',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus, { message: ValidationMessages.IS_ENUM })
  @Expose()
  status!: TaskStatus;

  @ApiProperty({
    description: 'タスク優先度',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority, { message: ValidationMessages.IS_ENUM })
  @Expose()
  priority!: TaskPriority;

  @ApiPropertyOptional({
    description: 'タスクの期限日時',
    example: '2025-06-30T23:59:59.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  dueDate!: Date | null;

  @ApiPropertyOptional({
    description: 'タスク完了日時',
    example: '2025-06-02T15:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  completedAt!: Date | null;

  @ApiProperty({
    description: '表示順序',
    example: 1,
  })
  @IsInt({ message: ValidationMessages.IS_INT })
  @Expose()
  position!: number;

  @ApiProperty({
    description: 'タスク作成日時',
    example: '2025-06-01T10:00:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'タスク更新日時',
    example: '2025-06-02T15:30:00.000Z',
  })
  @IsDateString({}, { message: ValidationMessages.IS_DATE })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({
    description: '関連付けられたタグ',
    type: [TaskTagResponseDto],
  })
  @Type(() => TaskTagResponseDto)
  @Expose()
  tags!: TaskTagResponseDto[];

  // 計算プロパティ
  @ApiProperty({
    description: 'タスクが完了済みかどうか',
    example: false,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isCompleted!: boolean;

  @ApiProperty({
    description: 'タスクがアーカイブ済みかどうか',
    example: false,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isArchived!: boolean;

  @ApiProperty({
    description: 'タスクが期限切れかどうか',
    example: false,
  })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN })
  @Expose()
  isOverdue!: boolean;

  @ApiPropertyOptional({
    description: '期限日までの日数（期限日がない場合はnull）',
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT })
  @Expose()
  daysUntilDue!: number | null;

  @ApiProperty({
    description: '優先度の順序（ソート用数値）',
    example: 2,
  })
  @IsInt({ message: ValidationMessages.IS_INT })
  @Expose()
  priorityOrder!: number;

  @ApiProperty({
    description: 'タグ名の配列',
    type: [String],
    example: ['フロントエンド', 'バックエンド'],
  })
  @Expose()
  tagNames!: string[];

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Task エンティティから TaskResponseDto を作成
   */
  static fromEntity(task: Task): TaskResponseDto {
    // タグ情報を変換
    const tags =
      task.taskTags?.map(
        taskTag =>
          new TaskTagResponseDto({
            id: taskTag.tag.id,
            name: taskTag.tag.name,
            color: taskTag.tag.color,
            isActive: taskTag.tag.isActive,
          }),
      ) ?? [];

    return new TaskResponseDto({
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      completedAt: task.completedAt ?? null,
      position: task.position,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      tags,
      isCompleted: task.isCompleted,
      isArchived: task.isArchived,
      isOverdue: task.isOverdue,
      daysUntilDue: task.daysUntilDue,
      priorityOrder: task.priorityOrder,
      tagNames: task.tagNames,
    });
  }

  /**
   * Task エンティティの配列から TaskResponseDto の配列を作成
   */
  static fromEntityArray(tasks: Task[]): TaskResponseDto[] {
    return tasks.map(task => TaskResponseDto.fromEntity(task));
  }
}

/**
 * タスク一覧レスポンス用の軽量DTO
 * 一覧表示で必要最小限の情報のみ含む
 */
export class TaskListItemDto {
  @ApiProperty({
    description: 'タスクID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'タスクタイトル',
    example: 'APIドキュメント作成',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'タスクステータス',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @Expose()
  status!: TaskStatus;

  @ApiProperty({
    description: 'タスク優先度',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @Expose()
  priority!: TaskPriority;

  @ApiPropertyOptional({
    description: 'タスクの期限日時',
    example: '2025-06-30T23:59:59.000Z',
    nullable: true,
  })
  @Expose()
  dueDate!: Date | null;

  @ApiProperty({
    description: '表示順序',
    example: 1,
  })
  @Expose()
  position!: number;

  @ApiProperty({
    description: 'タスク作成日時',
    example: '2025-06-01T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'タスクが完了済みかどうか',
    example: false,
  })
  @Expose()
  isCompleted!: boolean;

  @ApiProperty({
    description: 'タスクが期限切れかどうか',
    example: false,
  })
  @Expose()
  isOverdue!: boolean;

  @ApiProperty({
    description: 'タグ名の配列',
    type: [String],
    example: ['フロントエンド', 'バックエンド'],
  })
  @Expose()
  tagNames!: string[];

  @ApiProperty({
    description: 'タグの色配列',
    type: [String],
    example: ['#3B82F6', '#EF4444'],
  })
  @Expose()
  tagColors!: string[];

  constructor(partial: Partial<TaskListItemDto>) {
    Object.assign(this, partial);
  }

  /**
   * Task エンティティから TaskListItemDto を作成
   */
  static fromEntity(task: Task): TaskListItemDto {
    const tagColors = task.taskTags?.map(taskTag => taskTag.tag.color) ?? [];

    return new TaskListItemDto({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      position: task.position,
      createdAt: task.createdAt,
      isCompleted: task.isCompleted,
      isOverdue: task.isOverdue,
      tagNames: task.tagNames,
      tagColors,
    });
  }

  /**
   * Task エンティティの配列から TaskListItemDto の配列を作成
   */
  static fromEntityArray(tasks: Task[]): TaskListItemDto[] {
    return tasks.map(task => TaskListItemDto.fromEntity(task));
  }
}
