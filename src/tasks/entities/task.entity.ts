import { ApiProperty } from '@nestjs/swagger';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import type { Tag } from '@/tags/entities/tag.entity';
import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';
import { TaskConstants, TaskPriority, TaskStatus } from '@common/constants/app.constants';
import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('tasks')
@Index('ix_tasks_user_status', ['userId', 'status'])
@Index('ix_tasks_user_priority', ['userId', 'priority'])
@Index('ix_tasks_user_due_date', ['userId', 'dueDate'])
@Index('ix_tasks_position', ['userId', 'status', 'position'])
@Index('ix_tasks_completed_at', ['completedAt'])
@Index('ix_tasks_created_at', ['createdAt'])
export class Task extends BaseEntity {
  @ApiProperty({
    description: 'タスクの所有者ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'タスクの所有者ID',
  })
  @Index('ix_tasks_user_id')
  userId!: string;

  @ApiProperty({
    description: 'タスクタイトル',
    example: 'APIドキュメント作成',
    minLength: TaskConstants.TITLE_MIN_LENGTH,
    maxLength: TaskConstants.TITLE_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: TaskConstants.TITLE_MAX_LENGTH,
    nullable: false,
    comment: 'タスクタイトル',
  })
  title!: string;

  @ApiProperty({
    description: 'タスクの詳細説明',
    example: 'OpenAPI仕様書を作成する',
    required: false,
    maxLength: TaskConstants.DESCRIPTION_MAX_LENGTH,
  })
  @Column({
    type: 'text',
    nullable: true,
    comment: 'タスクの詳細説明',
  })
  description?: string | null;

  @ApiProperty({
    description: 'タスクステータス',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: TaskConstants.DEFAULT_STATUS,
    comment: 'タスクステータス（todo, in_progress, done, archived）',
  })
  status!: TaskStatus;

  @ApiProperty({
    description: 'タスク優先度',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: TaskConstants.DEFAULT_PRIORITY,
    comment: 'タスク優先度（low, medium, high, urgent）',
  })
  priority!: TaskPriority;

  @ApiProperty({
    description: 'タスクの期限日時（UTC）',
    example: '2025-06-05T15:00:00Z',
    required: false,
  })
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'タスクの期限日時（UTC）',
  })
  dueDate?: Date | null;

  @ApiProperty({
    description: 'タスク完了日時（UTC）',
    example: '2025-06-02T15:00:00Z',
    required: false,
  })
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'タスク完了日時（UTC）',
  })
  completedAt?: Date | null;

  @ApiProperty({
    description: '表示順序（小さい値ほど上位）',
    example: 1,
    minimum: TaskConstants.POSITION_MIN,
    maximum: TaskConstants.POSITION_MAX,
  })
  @Column({
    type: 'integer',
    nullable: false,
    default: TaskConstants.DEFAULT_POSITION,
    comment: '表示順序（小さい値ほど上位）',
  })
  position!: number;

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  owner!: User;

  @OneToMany(() => TaskTag, taskTag => taskTag.task, { cascade: true })
  taskTags!: TaskTag[];

  @BeforeInsert()
  @BeforeUpdate()
  validateFields(): void {
    this.validateTitle();
    this.validateStatus();
    this.validatePriority();
    this.validatePosition();
    this.validateDueDate();
  }

  private validateTitle(): void {
    if (!this.title?.trim()) {
      throw new Error(ValidationErrorMessages.TASK_TITLE_REQUIRED);
    }

    const trimmed = this.title.trim();

    if (trimmed.length < TaskConstants.TITLE_MIN_LENGTH) {
      throw new Error(ValidationErrorMessages.TASK_TITLE_REQUIRED);
    }

    if (trimmed.length > TaskConstants.TITLE_MAX_LENGTH) {
      throw new Error(ValidationErrorMessages.TASK_TITLE_TOO_LONG);
    }

    this.title = trimmed;
  }

  private validateStatus(): void {
    if (!Object.values(TaskStatus).includes(this.status)) {
      throw new Error(ValidationErrorMessages.TASK_STATUS_INVALID);
    }
  }

  private validatePriority(): void {
    if (!Object.values(TaskPriority).includes(this.priority)) {
      throw new Error(ValidationErrorMessages.TASK_PRIORITY_INVALID);
    }
  }

  private validatePosition(): void {
    if (this.position < TaskConstants.POSITION_MIN) {
      this.position = TaskConstants.POSITION_MIN;
    }
    if (this.position > TaskConstants.POSITION_MAX) {
      this.position = TaskConstants.POSITION_MAX;
    }
  }

  private validateDueDate(): void {
    // 過去の日時への設定を警告（エラーにはしない）
    if (this.dueDate && this.dueDate < new Date()) {
      // ログ出力やワーニングの実装はサービス層で行う
      // ここでは検証のみ
    }
  }

  markCompleted(): void {
    this.status = TaskStatus.DONE;
    this.completedAt = new Date();
  }

  markUncompleted(): void {
    if (this.status === TaskStatus.DONE) {
      this.status = TaskStatus.TODO;
    }
    this.completedAt = null;
  }

  archive(): void {
    this.status = TaskStatus.ARCHIVED;
  }

  unarchive(): void {
    if (this.status === TaskStatus.ARCHIVED) {
      this.status = TaskStatus.TODO;
    }
  }

  updatePosition(newPosition: number): void {
    if (newPosition < TaskConstants.POSITION_MIN || newPosition > TaskConstants.POSITION_MAX) {
      throw new Error(ValidationErrorMessages.TASK_POSITION_INVALID);
    }
    this.position = newPosition;
  }

  get isCompleted(): boolean {
    return this.status === TaskStatus.DONE;
  }

  get isArchived(): boolean {
    return this.status === TaskStatus.ARCHIVED;
  }

  get isOverdue(): boolean {
    if (!this.dueDate || this.isCompleted) {
      return false;
    }
    return this.dueDate < new Date();
  }

  get daysUntilDue(): number | null {
    if (!this.dueDate) {
      return null;
    }

    const today = new Date();
    const dueDateOnly = new Date(this.dueDate.getFullYear(), this.dueDate.getMonth(), this.dueDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = dueDateOnly.getTime() - todayOnly.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get tags(): Tag[] {
    return this.taskTags?.map(taskTag => taskTag.tag).filter(Boolean) ?? [];
  }

  get tagNames(): string[] {
    return this.tags.map(tag => tag.name);
  }

  get priorityOrder(): number {
    // 優先度の数値変換（ソート用）
    const priorityMap = {
      [TaskPriority.URGENT]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1,
    };
    return priorityMap[this.priority] ?? 0;
  }

  static getValidStatuses(): TaskStatus[] {
    return Object.values(TaskStatus);
  }

  static getValidPriorities(): TaskPriority[] {
    return Object.values(TaskPriority);
  }

  override toPlainObject(): Record<string, unknown> {
    const plainObject = super.toPlainObject();

    // 追加の計算プロパティを含める
    plainObject.isCompleted = this.isCompleted;
    plainObject.isArchived = this.isArchived;
    plainObject.isOverdue = this.isOverdue;
    plainObject.daysUntilDue = this.daysUntilDue;
    plainObject.tagNames = this.tagNames;
    plainObject.priorityOrder = this.priorityOrder;

    return plainObject;
  }
}
