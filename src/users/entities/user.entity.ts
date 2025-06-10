import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, OneToMany } from 'typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { Task } from '@/tasks/entities/task.entity';
import { UserConstants } from '@common/constants/app.constants';
import { EntityErrorMessages, ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { ValidationPatterns } from '@common/constants/validation.constants';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('users')
@Index('ix_users_email_active', ['email', 'isActive'])
@Index('ix_users_active_verified', ['isActive', 'isVerified'])
@Index('ix_users_last_login', ['lastLoginAt'])
export class User extends BaseEntity {
  @ApiProperty({
    description: 'メールアドレス（ログインID）',
    example: 'user@example.com',
    maxLength: UserConstants.EMAIL_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: UserConstants.EMAIL_MAX_LENGTH,
    unique: true,
    nullable: false,
    comment: 'メールアドレス（ログインID）',
  })
  @Index('ix_users_email')
  email!: string;

  @Exclude()
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Argon2ハッシュ化されたパスワード',
  })
  passwordHash!: string;

  @ApiProperty({
    description: '表示名',
    example: '田中太郎',
    minLength: UserConstants.DISPLAY_NAME_MIN_LENGTH,
    maxLength: UserConstants.DISPLAY_NAME_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: UserConstants.DISPLAY_NAME_MAX_LENGTH,
    nullable: false,
    comment: '表示名',
  })
  displayName!: string;

  @ApiProperty({
    description: 'アバター画像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
    maxLength: UserConstants.AVATAR_URL_MAX_LENGTH,
  })
  @Column({
    type: 'varchar',
    length: UserConstants.AVATAR_URL_MAX_LENGTH,
    nullable: true,
    comment: 'アバター画像URL',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'アカウント有効フラグ',
    example: true,
  })
  @Column({
    type: 'boolean',
    default: true,
    nullable: false,
    comment: 'アカウント有効フラグ',
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'メールアドレス認証済みフラグ',
    example: false,
  })
  @Column({
    type: 'boolean',
    default: false,
    nullable: false,
    comment: 'メールアドレス認証済みフラグ',
  })
  isVerified!: boolean;

  @ApiProperty({
    description: '最終ログイン日時',
    example: '2025-06-02T10:00:00Z',
    required: false,
  })
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '最終ログイン日時',
  })
  lastLoginAt?: Date | null;

  @Exclude()
  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
    comment: '連続ログイン失敗回数',
  })
  failedLoginAttempts!: number;

  @Exclude()
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'アカウントロック解除日時',
  })
  lockedUntil?: Date | null;

  @OneToMany(() => Task, task => task.owner, { cascade: true })
  tasks!: Task[];

  @OneToMany(() => Tag, tag => tag.owner, { cascade: true })
  tags!: Tag[];

  @BeforeInsert()
  @BeforeUpdate()
  validateFields(): void {
    this.validateEmail();
    this.validateDisplayName();
    this.validateFailedAttempts();
  }

  private validateEmail(): void {
    if (!this.email) {
      throw new Error(ValidationErrorMessages.EMAIL_REQUIRED);
    }

    if (!ValidationPatterns.EMAIL.test(this.email.trim())) {
      throw new Error(ValidationErrorMessages.EMAIL_INVALID);
    }

    this.email = this.email.toLowerCase().trim();
  }

  private validateDisplayName(): void {
    if (!this.displayName?.trim()) {
      throw new Error(ValidationErrorMessages.DISPLAY_NAME_REQUIRED);
    }

    const trimmed = this.displayName.trim();

    if (trimmed.length < UserConstants.DISPLAY_NAME_MIN_LENGTH) {
      throw new Error(ValidationErrorMessages.DISPLAY_NAME_TOO_SHORT);
    }

    if (trimmed.length > UserConstants.DISPLAY_NAME_MAX_LENGTH) {
      throw new Error(ValidationErrorMessages.DISPLAY_NAME_TOO_LONG);
    }

    if (!UserConstants.DISPLAY_NAME_PATTERN.test(trimmed)) {
      throw new Error(ValidationErrorMessages.DISPLAY_NAME_INVALID);
    }

    this.displayName = trimmed;
  }

  private validateFailedAttempts(): void {
    this.failedLoginAttempts = Math.max(0, this.failedLoginAttempts ?? 0);
  }

  recordLoginSuccess(): void {
    this.lastLoginAt = new Date();
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  recordLoginFailure(maxAttempts = 5, lockoutDurationMinutes = 30): void {
    this.failedLoginAttempts += 1;

    if (this.failedLoginAttempts >= maxAttempts) {
      this.lockedUntil = new Date(Date.now() + lockoutDurationMinutes * 60 * 1000);
    }
  }

  get isLocked(): boolean {
    if (!this.lockedUntil) {
      return false;
    }
    return new Date() < this.lockedUntil;
  }

  get canLogin(): boolean {
    return this.isActive && !this.isLocked;
  }

  override toPlainObject(): Record<string, unknown> {
    const plainObject = super.toPlainObject();

    // セキュリティ情報を除外
    delete plainObject.passwordHash;
    delete plainObject.failedLoginAttempts;
    delete plainObject.lockedUntil;

    return plainObject;
  }

  @Exclude()
  override validate(): string[] {
    const errors = super.validate();

    // User固有のバリデーション
    if (!this.email) {
      errors.push(EntityErrorMessages.USER_EMAIL_REQUIRED);
    }

    if (!this.displayName) {
      errors.push(EntityErrorMessages.USER_DISPLAY_NAME_REQUIRED);
    }

    if (this.failedLoginAttempts < 0) {
      errors.push(EntityErrorMessages.USER_LOGIN_ATTEMPTS_NEGATIVE);
    }

    return errors;
  }
}
