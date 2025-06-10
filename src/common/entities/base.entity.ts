import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateDateColumn, PrimaryGeneratedColumn, BaseEntity as TypeOrmBaseEntity, UpdateDateColumn } from 'typeorm';

import { EntityErrorMessages } from '@common/constants/error-messages.constants';

/**
 * 全エンティティの基底クラス
 * 共通フィールド（ID、作成日時、更新日時）とユーティリティーメソッドを提供
 */
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @ApiProperty({
    description: 'プライマリキー（UUID）',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: '作成日時（UTC）',
    example: '2025-06-02T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: '作成日時（UTC）',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '更新日時（UTC）',
    example: '2025-06-02T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: '更新日時（UTC）',
  })
  updatedAt!: Date;

  /**
   * エンティティをプレーンオブジェクトに変換
   */
  toPlainObject(): Record<string, unknown> {
    const plainObject: Record<string, unknown> = {};

    // 自身のプロパティをイテレート
    for (const key of Object.getOwnPropertyNames(this)) {
      const value = (this as Record<string, unknown>)[key];

      // 関数、プライベートプロパティ、undefinedは除外
      if (typeof value === 'function' || key.startsWith('_') || value === undefined) {
        continue;
      }

      // @Excludeデコレータが付いているプロパティは除外
      const isExcluded = Boolean(Reflect.getMetadata('class-transformer:exclude', this, key));
      if (isExcluded) {
        continue;
      }

      plainObject[key] = value;
    }

    return plainObject;
  }

  /**
   * エンティティの文字列表現
   */
  override toString(): string {
    return `${this.constructor.name}(id=${this.id})`;
  }

  /**
   * エンティティの等価性チェック
   * 同じクラス且つ同じIDを持つ場合に等価とみなす
   */
  equals(other: unknown): boolean {
    if (!other || !(other instanceof BaseEntity)) {
      return false;
    }

    // 同じクラスかチェック
    if (this.constructor !== other.constructor) {
      return false;
    }

    // IDが両方とも存在する場合はIDで比較
    if (this.id && other.id) {
      return this.id === other.id;
    }

    // どちらかのIDが存在しない場合は参照等価性で判定
    return this === other;
  }

  /**
   * 新規エンティティかどうか判定
   */
  get isNew(): boolean {
    return !this.id;
  }

  /**
   * 登録済みエンティティかどうか判定
   */
  get isPersisted(): boolean {
    return !!this.id && !!this.createdAt;
  }

  /**
   * 変更済みエンティティかどうか判定
   * 更新日時が作成日時より新しい場合に変更済みとみなす
   */
  get isModified(): boolean {
    if (!this.isPersisted) {
      return false;
    }

    return this.updatedAt.getTime() > this.createdAt.getTime();
  }

  /**
   * エンティティのハッシュ値を生成
   * Set や Map での使用を想定
   */
  hashCode(): string {
    if (this.id) {
      return `${this.constructor.name}:${this.id}`;
    }

    // IDがない場合は参照ベースのハッシュを生成
    return `${this.constructor.name}:${Date.now()}-${Math.random()}`;
  }

  /**
   * エンティティのクローンを作成
   * 注意: 浅いコピーのみ。関連エンティティは参照を共有
   */
  clone(): this {
    // TypeORM エンティティのクローンを作成
    const EntityClass = this.constructor as new () => this;
    const cloned = new EntityClass();

    // 現在のプロパティをコピー
    Object.assign(cloned, this);

    // 新規エンティティとして扱うためプロパティをクリア
    Object.defineProperty(cloned, 'id', { value: undefined, writable: true });
    Object.defineProperty(cloned, 'createdAt', { value: undefined, writable: true });
    Object.defineProperty(cloned, 'updatedAt', { value: undefined, writable: true });

    return cloned;
  }

  /**
   * バリデーション用のヘルパー
   * 子クラスでオーバーライドして独自のバリデーションロジックを実装
   */
  @Exclude()
  validate(): string[] {
    const errors: string[] = [];

    if (this.isPersisted && !this.id) {
      errors.push(EntityErrorMessages.ENTITY_ID_REQUIRED);
    }

    if (this.isPersisted && !this.createdAt) {
      errors.push(EntityErrorMessages.ENTITY_CREATED_AT_REQUIRED);
    }

    if (this.isPersisted && !this.updatedAt) {
      errors.push(EntityErrorMessages.ENTITY_UPDATED_AT_REQUIRED);
    }

    return errors;
  }
}
