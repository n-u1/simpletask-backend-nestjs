import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';
import { TagSuccessMessages } from '@common/constants/success-messages.constants';
import { PaginationMetaDto } from '@common/dto/pagination.dto';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

import { CreateTagDto } from './dto/create-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { TagListItemDto, TagResponseDto } from './dto/tag-response.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';

/**
 * タグ管理サービス
 * タグのCRUD操作、検索を提供
 */
@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(TaskTag)
    private readonly taskTagRepository: Repository<TaskTag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * タグを作成
   */
  async create(userId: string, createTagDto: CreateTagDto): Promise<TagResponseDto> {
    this.logger.log(`Creating tag for user ${userId.slice(-8)}`);

    // ユーザーの存在確認
    await this.validateUserExists(userId);

    // バリデーション
    const validationErrors = createTagDto.validateBusinessRules();
    if (validationErrors.length > 0) {
      throw BusinessLogicException.validationFailed(
        validationErrors.map(error => ({
          field: 'name',
          value: createTagDto.name,
          constraints: [error],
        })),
        'TagsService.create',
      );
    }

    // タグ名の重複チェック
    await this.validateTagNameUnique(userId, createTagDto.name);

    const createData = createTagDto.toCreateObject();

    // タグ作成
    const tag = this.tagRepository.create({
      userId,
      name: createData.name,
      color: createData.color,
      description: createData.description ?? null,
      isActive: true,
    });

    const savedTag = await this.tagRepository.save(tag);

    this.logger.log(`Tag created successfully: ${savedTag.id}`);
    return TagResponseDto.fromEntity(savedTag);
  }

  /**
   * ページネーション付きタグ一覧取得
   */
  async findMany(
    userId: string,
    query: TagQueryDto,
  ): Promise<{
    tags: TagListItemDto[];
    meta: PaginationMetaDto;
  }> {
    this.logger.log(
      `Fetching tags for user ${userId.slice(-8)} with filters: ${JSON.stringify(query.getFilterSummary())}`,
    );

    await this.validateUserExists(userId);

    const queryBuilder = this.buildTagQuery(userId, query);

    const totalCount = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`tag.${query.sortBy}`, query.order.toUpperCase() as 'ASC' | 'DESC')
      .skip(query.offset)
      .take(query.limit);

    const tags = await queryBuilder.getMany();

    const tagListItems = TagListItemDto.fromEntityArray(tags);
    const meta = new PaginationMetaDto(query, totalCount);

    this.logger.log(`Retrieved ${tags.length} tags (total: ${totalCount})`);

    return {
      tags: tagListItems,
      meta,
    };
  }

  /**
   * タグ詳細取得
   */
  async findOne(id: string, userId: string): Promise<TagResponseDto> {
    this.logger.log(`Fetching tag ${id} for user ${userId.slice(-8)}`);

    const tag = await this.findTagById(id, userId);

    return TagResponseDto.fromEntity(tag);
  }

  /**
   * タグ更新
   */
  async update(id: string, userId: string, updateTagDto: UpdateTagDto): Promise<TagResponseDto> {
    this.logger.log(`Updating tag ${id} for user ${userId.slice(-8)}`);

    // 更新対象があるかチェック
    if (!updateTagDto.hasUpdates()) {
      throw BusinessLogicException.validationFailed(
        [{ field: 'body', value: 'empty', constraints: ['更新する項目がありません'] }],
        'TagsService.update',
      );
    }

    // バリデーション
    const validationErrors = updateTagDto.validateBusinessRules();
    if (validationErrors.length > 0) {
      throw BusinessLogicException.validationFailed(
        validationErrors.map(error => ({
          field: 'general',
          value: 'validation',
          constraints: [error],
        })),
        'TagsService.update',
      );
    }

    // 既存タグ取得
    const existingTag = await this.findTagById(id, userId);

    // タグ名重複チェック（名前が変更される場合）
    if (updateTagDto.hasNameUpdate() && updateTagDto.name !== existingTag.name) {
      await this.validateTagNameUnique(userId, updateTagDto.name!);
    }

    const updateData = updateTagDto.toUpdateObject();

    // 更新実行
    await this.tagRepository.update({ id, userId }, updateData);

    // 更新後のタグを取得
    const updatedTag = await this.findTagById(id, userId);

    this.logger.log(`Tag updated successfully: ${id}`);
    return TagResponseDto.fromEntity(updatedTag);
  }

  /**
   * タグ削除
   */
  async remove(id: string, userId: string): Promise<{ deletedId: string; message: string }> {
    this.logger.log(`Deleting tag ${id} for user ${userId.slice(-8)}`);

    // タグの存在確認
    await this.findTagById(id, userId);

    // 使用中かチェック（削除制御のため）
    const usageCount = await this.taskTagRepository.count({ where: { tagId: id } });
    if (usageCount > 0) {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: 'tagId',
            value: id,
            constraints: [`このタグは${usageCount}個のタスクで使用されているため削除できません`],
          },
        ],
        'TagsService.remove',
      );
    }

    // 削除実行
    await this.tagRepository.delete({ id, userId });

    this.logger.log(`Tag deleted successfully: ${id}`);
    return {
      deletedId: id,
      message: TagSuccessMessages.TAG_DELETED,
    };
  }

  /**
   * ユーザーの全アクティブタグ取得（簡易版）
   */
  async findAllActive(userId: string): Promise<TagListItemDto[]> {
    this.logger.log(`Fetching all active tags for user ${userId.slice(-8)}`);

    await this.validateUserExists(userId);

    const tags = await this.tagRepository.find({
      where: { userId, isActive: true },
      order: { name: 'ASC' },
    });

    return TagListItemDto.fromEntityArray(tags);
  }

  // ===== プライベートメソッド =====

  /**
   * ユーザーの存在確認
   */
  private async validateUserExists(userId: string): Promise<void> {
    const userExists = await this.userRepository.exists({
      where: { id: userId, isActive: true },
    });

    if (!userExists) {
      throw ResourceNotFoundException.user(userId, 'TagsService.validateUserExists');
    }
  }

  /**
   * タグ名の重複チェック
   */
  private async validateTagNameUnique(userId: string, name: string): Promise<void> {
    const existingTag = await this.tagRepository.findOne({
      where: { userId, name, isActive: true },
      select: ['id'],
    });

    if (existingTag) {
      throw BusinessLogicException.tagNameDuplicate(name, userId, 'TagsService.validateTagNameUnique');
    }
  }

  /**
   * タグをIDで取得
   */
  private async findTagById(tagId: string, userId: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id: tagId, userId },
    });

    if (!tag) {
      throw ResourceNotFoundException.tag(tagId, userId, 'TagsService.findTagById');
    }

    return tag;
  }

  /**
   * 検索用クエリビルダー構築
   */
  private buildTagQuery(userId: string, query: TagQueryDto): SelectQueryBuilder<Tag> {
    const conditions = query.toWhereConditions();
    const qb = this.tagRepository.createQueryBuilder('tag').where('tag.userId = :userId', { userId });

    // 検索キーワード
    if (conditions.search) {
      qb.andWhere('(tag.name ILIKE :search OR tag.description ILIKE :search)', {
        search: `%${conditions.search}%`,
      });
    }

    // 色フィルタ
    if (conditions.colors && conditions.colors.length > 0) {
      qb.andWhere('tag.color IN (:...colors)', { colors: conditions.colors });
    }

    // アクティブ状態フィルタ
    if (conditions.includeActive && !conditions.includeInactive) {
      qb.andWhere('tag.isActive = true');
    } else if (!conditions.includeActive && conditions.includeInactive) {
      qb.andWhere('tag.isActive = false');
    }
    // 両方trueまたは両方falseの場合は条件追加なし

    // 作成日フィルタ
    if (conditions.createdFrom) {
      qb.andWhere('tag.createdAt >= :createdFrom', { createdFrom: conditions.createdFrom });
    }
    if (conditions.createdTo) {
      qb.andWhere('tag.createdAt <= :createdTo', { createdTo: conditions.createdTo });
    }

    return qb;
  }
}
