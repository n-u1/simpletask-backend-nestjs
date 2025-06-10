import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { Task } from '@/tasks/entities/task.entity';
import { TaskStatus } from '@common/constants/app.constants';
import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('task_tags')
@Unique('uq_task_tags_task_tag', ['taskId', 'tagId'])
@Index('ix_task_tags_task_id', ['taskId'])
@Index('ix_task_tags_tag_id', ['tagId'])
@Index('ix_task_tags_task_tag', ['taskId', 'tagId'])
export class TaskTag extends BaseEntity {
  @ApiProperty({
    description: '関連付けるタスクID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column({
    type: 'uuid',
    nullable: false,
    comment: '関連付けるタスクID',
  })
  taskId!: string;

  @ApiProperty({
    description: '関連付けるタグID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @Column({
    type: 'uuid',
    nullable: false,
    comment: '関連付けるタグID',
  })
  tagId!: string;

  @ManyToOne(() => Task, task => task.taskTags, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @ManyToOne(() => Tag, tag => tag.taskTags, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'tagId' })
  tag!: Tag;

  static createAssociation(taskId: string, tagId: string): TaskTag {
    const taskTag = new TaskTag();
    taskTag.taskId = taskId;
    taskTag.tagId = tagId;
    return taskTag;
  }

  validateAssociation(): void {
    if (!this.taskId) {
      throw new Error(ValidationErrorMessages.TASK_ID_REQUIRED);
    }
    if (!this.tagId) {
      throw new Error(ValidationErrorMessages.TAG_ID_REQUIRED);
    }
    if (this.taskId === this.tagId) {
      throw new Error(ValidationErrorMessages.TASK_TAG_IDS_SAME);
    }
  }

  getTaskTitle(): string | null {
    return this.task?.title ?? null;
  }

  getTagName(): string | null {
    return this.tag?.name ?? null;
  }

  getTagColor(): string | null {
    return this.tag?.color ?? null;
  }

  isTaskCompleted(): boolean {
    return this.task?.status === TaskStatus.DONE;
  }

  isTaskArchived(): boolean {
    return this.task?.status === TaskStatus.ARCHIVED;
  }

  isTagActive(): boolean {
    return this.tag?.isActive ?? false;
  }

  isValid(): boolean {
    return this.isTagActive() && !this.isTaskArchived();
  }

  get taskStatus(): string | null {
    return this.task?.status ?? null;
  }

  get taskPriority(): string | null {
    return this.task?.priority ?? null;
  }

  get taskDueDate(): Date | null {
    return this.task?.dueDate ?? null;
  }

  get isTaskOverdue(): boolean {
    return this.task?.isOverdue ?? false;
  }

  get tagDisplayInfo(): {
    name: string | null;
    color: string | null;
    isActive: boolean;
  } {
    return {
      name: this.getTagName(),
      color: this.getTagColor(),
      isActive: this.isTagActive(),
    };
  }

  get taskDisplayInfo(): {
    title: string | null;
    status: string | null;
    priority: string | null;
    dueDate: Date | null;
    isCompleted: boolean;
    isArchived: boolean;
    isOverdue: boolean;
  } {
    return {
      title: this.getTaskTitle(),
      status: this.taskStatus,
      priority: this.taskPriority,
      dueDate: this.taskDueDate,
      isCompleted: this.isTaskCompleted(),
      isArchived: this.isTaskArchived(),
      isOverdue: this.isTaskOverdue,
    };
  }

  get associationInfo(): {
    taskId: string;
    tagId: string;
    taskTitle: string | null;
    tagName: string | null;
    tagColor: string | null;
    isValid: boolean;
  } {
    return {
      taskId: this.taskId,
      tagId: this.tagId,
      taskTitle: this.getTaskTitle(),
      tagName: this.getTagName(),
      tagColor: this.getTagColor(),
      isValid: this.isValid(),
    };
  }

  static getAssociationKey(taskId: string, tagId: string): string {
    return `task:${taskId}:tag:${tagId}`;
  }

  static createFromIds(taskId: string, tagId: string): TaskTag {
    const taskTag = new TaskTag();
    taskTag.taskId = taskId;
    taskTag.tagId = tagId;
    taskTag.validateAssociation();
    return taskTag;
  }

  static bulkCreate(taskId: string, tagIds: string[]): TaskTag[] {
    return tagIds.map(tagId => TaskTag.createFromIds(taskId, tagId));
  }

  isSameAssociation(other: TaskTag): boolean {
    return this.taskId === other.taskId && this.tagId === other.tagId;
  }

  override toString(): string {
    const taskTitle = this.getTaskTitle() ?? 'Unknown Task';
    const tagName = this.getTagName() ?? 'Unknown Tag';
    return `TaskTag(task: "${taskTitle}", tag: "${tagName}")`;
  }

  override toPlainObject(): Record<string, unknown> {
    const plainObject = super.toPlainObject();

    // 関連情報を含める
    plainObject.taskInfo = this.taskDisplayInfo;
    plainObject.tagInfo = this.tagDisplayInfo;
    plainObject.associationInfo = this.associationInfo;
    plainObject.isValid = this.isValid();

    return plainObject;
  }
}
