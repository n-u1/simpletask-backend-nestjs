import { CanActivate, ExecutionContext, Injectable, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { Task } from '@/tasks/entities/task.entity';
import { User } from '@/users/entities/user.entity';
import { AuthErrorMessages, GeneralErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

/**
 * 所有権チェック設定のインターフェース
 */
export interface OwnershipConfig {
  /** リソースタイプ */
  resourceType: 'task' | 'tag' | 'user';
  /** パラメータ名（デフォルト: 'id'） */
  paramName?: string;
  /** 所有者フィールド名（デフォルト: 'userId'） */
  ownerField?: string;
  /** 自分自身のリソースの場合はチェックをスキップ */
  allowSelf?: boolean;
}

/**
 * 所有権チェック用デコレータ
 */
export const RequireOwnership = (config: OwnershipConfig): MethodDecorator => SetMetadata('ownership', config);

/**
 * リソース所有権ガード
 * ユーザーが指定されたリソースの所有者かどうかをチェック
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 所有権設定を取得
    const ownershipConfig = this.reflector.get<OwnershipConfig>('ownership', context.getHandler());

    // 設定がない場合はスキップ
    if (!ownershipConfig) {
      return true;
    }

    // 認証されたユーザーを取得
    const user = this.extractUser(request);
    if (!user) {
      throw new BusinessLogicException(AuthErrorMessages.UNAUTHORIZED, 'UNAUTHORIZED', {}, 'OwnershipGuard');
    }

    try {
      return await this.checkOwnership(request, user, ownershipConfig);
    } catch (error) {
      this.logger.warn('Ownership check failed', {
        userId: user.id,
        resourceType: ownershipConfig.resourceType,
        paramName: ownershipConfig.paramName ?? 'id',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * 所有権チェックのメイン処理
   */
  private async checkOwnership(request: Request, user: User, config: OwnershipConfig): Promise<boolean> {
    const resourceId = this.extractResourceId(request, config.paramName ?? 'id');

    if (!resourceId) {
      throw new BusinessLogicException(
        GeneralErrorMessages.MISSING_RESOURCE_ID,
        'MISSING_RESOURCE_ID',
        { paramName: config.paramName ?? 'id' },
        'OwnershipGuard',
      );
    }

    // 自分自身のリソースチェック（ユーザーリソースの場合）
    if (config.allowSelf && config.resourceType === 'user' && resourceId === user.id) {
      this.logger.log('Self access granted', {
        userId: user.id,
        resourceId,
      });
      return true;
    }

    // リソース固有の所有権チェック
    return await this.checkResourceOwnership(user.id, resourceId, config.resourceType, config.ownerField ?? 'userId');
  }

  /**
   * リソース固有の所有権チェック
   */
  private async checkResourceOwnership(
    userId: string,
    resourceId: string,
    resourceType: OwnershipConfig['resourceType'],
    ownerField: string,
  ): Promise<boolean> {
    switch (resourceType) {
      case 'task':
        return await this.checkTaskOwnership(userId, resourceId, ownerField);

      case 'tag':
        return await this.checkTagOwnership(userId, resourceId, ownerField);

      case 'user':
        return await this.checkUserOwnership(userId, resourceId);

      default:
        throw new BusinessLogicException(
          GeneralErrorMessages.UNSUPPORTED_RESOURCE_TYPE,
          'UNSUPPORTED_RESOURCE_TYPE',
          { resourceType },
          'OwnershipGuard',
        );
    }
  }

  /**
   * タスクの所有権チェック
   */
  private async checkTaskOwnership(userId: string, taskId: string, ownerField: string): Promise<boolean> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      select: ['id', ownerField as keyof Task],
    });

    if (!task) {
      throw ResourceNotFoundException.task(taskId, userId, 'OwnershipGuard');
    }

    const ownerId = (task as unknown as Record<string, unknown>)[ownerField] as string;
    if (ownerId !== userId) {
      throw BusinessLogicException.accessDenied('Task', taskId, userId, 'OwnershipGuard');
    }

    return true;
  }

  /**
   * タグの所有権チェック
   */
  private async checkTagOwnership(userId: string, tagId: string, ownerField: string): Promise<boolean> {
    const tag = await this.tagRepository.findOne({
      where: { id: tagId, isActive: true },
      select: ['id', ownerField as keyof Tag],
    });

    if (!tag) {
      throw ResourceNotFoundException.tag(tagId, userId, 'OwnershipGuard');
    }

    const ownerId = (tag as unknown as Record<string, unknown>)[ownerField] as string;
    if (ownerId !== userId) {
      throw BusinessLogicException.accessDenied('Tag', tagId, userId, 'OwnershipGuard');
    }

    return true;
  }

  /**
   * ユーザーの所有権チェック（自分自身かどうか）
   */
  private async checkUserOwnership(userId: string, targetUserId: string): Promise<boolean> {
    // ユーザーが存在するかチェック
    const user = await this.userRepository.findOne({
      where: { id: targetUserId, isActive: true },
      select: ['id'],
    });

    if (!user) {
      throw ResourceNotFoundException.user(targetUserId, 'OwnershipGuard');
    }

    // 自分自身のユーザーリソースかチェック
    if (targetUserId !== userId) {
      throw BusinessLogicException.accessDenied('User', targetUserId, userId, 'OwnershipGuard');
    }

    return true;
  }

  /**
   * リクエストからユーザー情報を抽出
   */
  private extractUser(request: Request): User | null {
    // JWT認証ガードによって設定されたユーザー情報を取得
    const user = (request as Request & { user?: User }).user;

    if (!user) {
      return null;
    }

    // ユーザーオブジェクトの基本的な検証
    if (!user.id || typeof user.id !== 'string') {
      this.logger.warn('Invalid user object in request', {
        userKeys: Object.keys(user),
      });
      return null;
    }

    return user;
  }

  /**
   * リクエストからリソースIDを抽出
   */
  private extractResourceId(request: Request, paramName: string): string | null {
    // パスパラメータから取得
    const paramValue = request.params[paramName];
    if (paramValue && typeof paramValue === 'string') {
      return paramValue;
    }

    // クエリパラメータから取得（フォールバック）
    const queryValue = request.query[paramName];
    if (queryValue && typeof queryValue === 'string') {
      return queryValue;
    }

    // ボディから取得（POST/PUT リクエストの場合）
    if (request.body && typeof request.body === 'object') {
      const bodyValue = (request.body as Record<string, unknown>)[paramName];
      if (bodyValue && typeof bodyValue === 'string') {
        return bodyValue;
      }
    }

    return null;
  }
}
