import { ApiProperty } from '@nestjs/swagger';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';

import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import type { Task } from '@/tasks/entities/task.entity';
import { User } from '@/users/entities/user.entity';
import { TagConstants, validateColorCode } from '@common/constants/app.constants';
import { ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('tags')
@Unique('uq_tags_user_name', ['userId', 'name'])
@Index('ix_tags_user_name', ['userId', 'name'])
@Index('ix_tags_user_active', ['userId', 'isActive'])
@Index('ix_tags_active', ['isActive'])
export class Tag extends BaseEntity {
  @ApiProperty({
    description: 'タグの所有者ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'タグの所有者ID',
  })
  @Index('ix_tags_user_id')
  userId!: string;

  @ApiProperty({
    description: 'タグ名',
    example: '開発',
    minLength: TagConstants.NAME_MIN_LENGTH,
    maxLength: TagConstants.NAME_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: TagConstants.NAME_MAX_LENGTH,
    nullable: false,
    comment: 'タグ名',
  })
  name!: string;

  @ApiProperty({
    description: 'タグの表示色（16進数カラーコード）',
    example: '#3B82F6',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @Column({
    type: 'varchar',
    length: 7,
    nullable: false,
    default: TagConstants.DEFAULT_COLOR,
    comment: 'タグの表示色（16進数カラーコード）',
  })
  color!: string;

  @ApiProperty({
    description: 'タグの説明',
    example: '開発関連のタスク',
    required: false,
    maxLength: TagConstants.DESCRIPTION_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: TagConstants.DESCRIPTION_MAX_LENGTH,
    nullable: true,
    comment: 'タグの説明',
  })
  description?: string | null;

  @ApiProperty({
    description: 'アクティブフラグ（ソフトデリート用）',
    example: true,
  })
  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
    comment: 'アクティブフラグ（ソフトデリート用）',
  })
  isActive!: boolean;

  @ManyToOne(() => User, user => user.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  owner!: User;

  @OneToMany(() => TaskTag, taskTag => taskTag.tag, { cascade: true })
  taskTags!: TaskTag[];

  @BeforeInsert()
  @BeforeUpdate()
  validateFields(): void {
    this.validateName();
    this.validateColor();
    this.validateDescription();
  }

  private validateName(): void {
    if (!this.name?.trim()) {
      throw new Error(ValidationErrorMessages.TAG_NAME_REQUIRED);
    }

    const trimmed = this.name.trim();

    if (trimmed.length < TagConstants.NAME_MIN_LENGTH) {
      throw new Error(ValidationErrorMessages.TAG_NAME_REQUIRED);
    }

    if (trimmed.length > TagConstants.NAME_MAX_LENGTH) {
      throw new Error(ValidationErrorMessages.TAG_NAME_TOO_LONG);
    }

    this.name = trimmed;
  }

  private validateColor(): void {
    if (!this.color) {
      this.color = TagConstants.DEFAULT_COLOR;
      return;
    }

    const trimmed = this.color.trim().toUpperCase();

    if (!validateColorCode(trimmed)) {
      throw new Error(ValidationErrorMessages.TAG_COLOR_INVALID);
    }

    this.color = trimmed;
  }

  private validateDescription(): void {
    if (this.description === null || this.description === undefined) {
      return;
    }

    const trimmed = this.description.trim();

    if (trimmed.length > TagConstants.DESCRIPTION_MAX_LENGTH) {
      throw new Error(ValidationErrorMessages.TAG_DESCRIPTION_TOO_LONG);
    }

    this.description = trimmed || null;
  }

  softDelete(): void {
    this.isActive = false;
  }

  restore(): void {
    this.isActive = true;
  }

  updateColor(newColor: string): void {
    if (!validateColorCode(newColor)) {
      throw new Error(ValidationErrorMessages.TAG_COLOR_INVALID);
    }
    this.color = newColor.toUpperCase();
  }

  get tasks(): Task[] {
    return this.taskTags?.map(taskTag => taskTag.task).filter(Boolean) ?? [];
  }

  get colorRgb(): [number, number, number] {
    const color = this.color.slice(1); // #を除去
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    return [r, g, b];
  }

  get colorHsl(): [number, number, number] {
    const [rVal, gVal, bVal] = this.colorRgb;
    const r = rVal / 255;
    const g = gVal / 255;
    const b = bVal / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;

    // Lightness
    const l = sum / 2;

    if (diff === 0) {
      return [0, 0, Math.round(l * 100)]; // グレースケール
    }

    // Saturation
    const s = l > 0.5 ? diff / (2 - sum) : diff / sum;

    // Hue
    let h = 0;
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  get isPresetColor(): boolean {
    return (TagConstants.PRESET_COLORS as readonly string[]).includes(this.color);
  }

  get isDarkColor(): boolean {
    const [, , lightness] = this.colorHsl;
    return lightness < 50; // 明度が50%未満
  }

  get contrastTextColor(): string {
    return this.isDarkColor ? '#FFFFFF' : '#000000';
  }

  static getPresetColors(): readonly string[] {
    return TagConstants.PRESET_COLORS;
  }

  static generateRandomColor(): string {
    const colors = TagConstants.PRESET_COLORS;
    return colors[Math.floor(Math.random() * colors.length)] ?? TagConstants.DEFAULT_COLOR;
  }

  /**
   * 計算プロパティを含むプレーンオブジェクトを返す
   */
  override toPlainObject(): Record<string, unknown> {
    const plainObject = super.toPlainObject();

    // 追加の計算プロパティを含める
    plainObject.colorRgb = this.colorRgb;
    plainObject.colorHsl = this.colorHsl;
    plainObject.isPresetColor = this.isPresetColor;
    plainObject.isDarkColor = this.isDarkColor;
    plainObject.contrastTextColor = this.contrastTextColor;

    return plainObject;
  }
}
