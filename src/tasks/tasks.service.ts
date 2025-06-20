import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';
import { TaskStatus } from '@common/constants/app.constants';
import { TaskSuccessMessages } from '@common/constants/success-messages.constants';
import { PaginationMetaDto } from '@common/dto/pagination.dto';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskListItemDto, TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

/**
 * タスク管理サービス
 * タスクのCRUD操作、検索、一括操作を提供
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskTag)
    private readonly taskTagRepository: Repository<TaskTag>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * タスクを作成
   */
  async create(userId: string, createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    this.logger.log(`Creating task for user ${userId.slice(-8)}`);

    // ユーザーの存在確認
    await this.validateUserExists(userId);

    // バリデーション
    const validationErrors = createTaskDto.validateBusinessRules();
    if (validationErrors.length > 0) {
      throw BusinessLogicException.validationFailed(
        validationErrors.map(error => ({
          field: 'dueDate',
          value: createTaskDto.dueDate ?? 'unknown',
          constraints: [error],
        })),
        'TasksService.create',
      );
    }

    const createData = createTaskDto.toCreateObject();

    // タグの存在確認
    let validatedTagIds: string[] = [];
    if (createData.tagIds.length > 0) {
      validatedTagIds = await this.validateUserTags(userId, createData.tagIds);
    }

    // トランザクション内でタスクとタグの関連付けを作成
    return await this.dataSource.transaction(async manager => {
      // タスク作成
      const taskData: Partial<Task> = {
        userId,
        title: createData.title,
        description: createData.description ?? null,
        status: createData.status,
        priority: createData.priority,
        dueDate: createData.dueDate ?? null,
        position: createData.position,
      };

      const task = manager.create(Task, taskData);
      const savedTask = await manager.save(Task, task);

      // タグとの関連付け作成
      if (validatedTagIds.length > 0) {
        const taskTags = validatedTagIds.map(tagId =>
          manager.create(TaskTag, {
            taskId: savedTask.id,
            tagId,
          }),
        );
        await manager.save(TaskTag, taskTags);
      }

      // 関連データを含めて再取得
      const taskWithRelations = await this.findOneWithRelations(savedTask.id, userId, manager);

      this.logger.log(`Task created successfully: ${savedTask.id}`);
      return TaskResponseDto.fromEntity(taskWithRelations);
    });
  }

  /**
   * ページネーション付きタスク一覧取得
   */
  async findMany(
    userId: string,
    query: TaskQueryDto,
  ): Promise<{
    tasks: TaskListItemDto[];
    meta: PaginationMetaDto;
  }> {
    this.logger.log(
      `Fetching tasks for user ${userId.slice(-8)} with filters: ${JSON.stringify(query.getFilterSummary())}`,
    );

    await this.validateUserExists(userId);

    const queryBuilder = this.buildTaskQuery(userId, query);

    const totalCount = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`task.${query.sortBy}`, query.order.toUpperCase() as 'ASC' | 'DESC')
      .skip(query.offset)
      .take(query.limit);

    const tasks = await queryBuilder.getMany();

    const taskListItems = TaskListItemDto.fromEntityArray(tasks);
    const meta = new PaginationMetaDto(query, totalCount);

    this.logger.log(`Retrieved ${tasks.length} tasks (total: ${totalCount})`);

    return {
      tasks: taskListItems,
      meta,
    };
  }

  /**
   * タスク詳細取得
   */
  async findOne(id: string, userId: string): Promise<TaskResponseDto> {
    this.logger.log(`Fetching task ${id} for user ${userId.slice(-8)}`);

    const task = await this.findTaskWithRelations(id, userId);
    return TaskResponseDto.fromEntity(task);
  }

  /**
   * タスク更新
   */
  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    this.logger.log(`Updating task ${id} for user ${userId.slice(-8)}`);

    // 更新対象があるかチェック
    if (!updateTaskDto.hasUpdates()) {
      throw BusinessLogicException.validationFailed(
        [{ field: 'body', value: 'empty', constraints: ['更新する項目がありません'] }],
        'TasksService.update',
      );
    }

    // バリデーション
    const validationErrors = updateTaskDto.validateBusinessRules();
    if (validationErrors.length > 0) {
      throw BusinessLogicException.validationFailed(
        validationErrors.map(error => ({
          field: 'general',
          value: 'validation',
          constraints: [error],
        })),
        'TasksService.update',
      );
    }

    // 既存タスク取得（存在確認のため）
    await this.findTaskWithRelations(id, userId);
    const updateData = updateTaskDto.toUpdateObject();

    // タグ更新の場合、タグの存在確認
    let validatedTagIds: string[] | undefined;
    if (updateData.tagIds !== undefined) {
      validatedTagIds = updateData.tagIds.length > 0 ? await this.validateUserTags(userId, updateData.tagIds) : [];
    }

    // トランザクション内で更新
    return await this.dataSource.transaction(async manager => {
      // タスクの基本情報更新
      const updateFields: Partial<Task> = {};

      if (updateData.title !== undefined) {
        updateFields.title = updateData.title;
      }
      if (updateData.description !== undefined) {
        updateFields.description = updateData.description;
      }
      if (updateData.status !== undefined) {
        updateFields.status = updateData.status;
      }
      if (updateData.priority !== undefined) {
        updateFields.priority = updateData.priority;
      }
      if (updateData.dueDate !== undefined) {
        updateFields.dueDate = updateData.dueDate;
      }
      if (updateData.position !== undefined) {
        updateFields.position = updateData.position;
      }

      // フラグによる処理
      if (updateData.markCompleted === true) {
        updateFields.status = TaskStatus.DONE;
        updateFields.completedAt = new Date();
      } else if (updateData.markArchived === true) {
        updateFields.status = TaskStatus.ARCHIVED;
      }

      // 基本情報の更新がある場合
      if (Object.keys(updateFields).length > 0) {
        await manager.update(Task, { id, userId }, updateFields);
      }

      // タグの関連付け更新
      if (validatedTagIds !== undefined) {
        // 既存の関連付けを削除
        await manager.delete(TaskTag, { taskId: id });

        // 新しい関連付けを作成
        if (validatedTagIds.length > 0) {
          const taskTags = validatedTagIds.map(tagId => manager.create(TaskTag, { taskId: id, tagId }));
          await manager.save(TaskTag, taskTags);
        }
      }

      // 更新後のタスクを取得
      const updatedTask = await this.findOneWithRelations(id, userId, manager);

      this.logger.log(`Task updated successfully: ${id}`);
      return TaskResponseDto.fromEntity(updatedTask);
    });
  }

  /**
   * タスク削除
   */
  async remove(id: string, userId: string): Promise<{ deletedId: string; message: string }> {
    this.logger.log(`Deleting task ${id} for user ${userId.slice(-8)}`);

    // タスクの存在確認
    await this.findTaskWithRelations(id, userId);

    // 削除実行（TaskTagもカスケードで削除される）
    await this.taskRepository.delete({ id, userId });

    this.logger.log(`Task deleted successfully: ${id}`);
    return {
      deletedId: id,
      message: TaskSuccessMessages.TASK_DELETED,
    };
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
      throw ResourceNotFoundException.user(userId, 'TasksService.validateUserExists');
    }
  }

  /**
   * ユーザーのタグ存在確認
   */
  private async validateUserTags(userId: string, tagIds: string[]): Promise<string[]> {
    const existingTags = await this.tagRepository.find({
      where: {
        id: In(tagIds),
        userId,
        isActive: true,
      },
      select: ['id'],
    });

    const existingTagIds = existingTags.map(tag => tag.id);
    const missingTagIds = tagIds.filter(id => !existingTagIds.includes(id));

    if (missingTagIds.length > 0) {
      throw BusinessLogicException.validationFailed(
        [
          {
            field: 'tagIds',
            value: missingTagIds,
            constraints: [`存在しないタグID: ${missingTagIds.join(', ')}`],
          },
        ],
        'TasksService.validateUserTags',
      );
    }

    return existingTagIds;
  }

  /**
   * タスクを関連データと共に取得
   */
  private async findTaskWithRelations(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId },
      relations: ['taskTags', 'taskTags.tag'],
    });

    if (!task) {
      throw ResourceNotFoundException.task(taskId, userId, 'TasksService.findTaskWithRelations');
    }

    return task;
  }

  /**
   * 関連データと共にタスクを取得
   */
  private async findOneWithRelations(taskId: string, userId: string, manager: EntityManager): Promise<Task> {
    const task = await manager.findOne(Task, {
      where: { id: taskId, userId },
      relations: ['taskTags', 'taskTags.tag'],
    });

    if (!task) {
      throw ResourceNotFoundException.task(taskId, userId, 'TasksService.findOneWithRelations');
    }

    return task;
  }

  /**
   * 検索用クエリビルダー構築
   */
  private buildTaskQuery(userId: string, query: TaskQueryDto): SelectQueryBuilder<Task> {
    const conditions = query.toWhereConditions();
    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.taskTags', 'taskTag')
      .leftJoinAndSelect('taskTag.tag', 'tag')
      .where('task.userId = :userId', { userId });

    // 検索キーワード
    if (conditions.search) {
      qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${conditions.search}%`,
      });
    }

    // ステータスフィルタ
    if (conditions.statuses && conditions.statuses.length > 0) {
      qb.andWhere('task.status IN (:...statuses)', { statuses: conditions.statuses });
    }

    // 優先度フィルタ
    if (conditions.priorities && conditions.priorities.length > 0) {
      qb.andWhere('task.priority IN (:...priorities)', { priorities: conditions.priorities });
    }

    // 完了タスクの除外
    if (!conditions.includeCompleted) {
      qb.andWhere('task.status != :doneStatus', { doneStatus: TaskStatus.DONE });
    }

    // アーカイブタスクの除外
    if (!conditions.includeArchived) {
      qb.andWhere('task.status != :archivedStatus', { archivedStatus: TaskStatus.ARCHIVED });
    }

    // 期限日フィルタ
    if (conditions.dueDateFrom) {
      qb.andWhere('task.dueDate >= :dueDateFrom', { dueDateFrom: conditions.dueDateFrom });
    }
    if (conditions.dueDateTo) {
      qb.andWhere('task.dueDate <= :dueDateTo', { dueDateTo: conditions.dueDateTo });
    }

    // 期限切れフィルタ
    if (conditions.overdue) {
      qb.andWhere('task.dueDate < :now AND task.status != :doneStatus', {
        now: new Date(),
        doneStatus: TaskStatus.DONE,
      });
    }

    // 作成日フィルタ
    if (conditions.createdFrom) {
      qb.andWhere('task.createdAt >= :createdFrom', { createdFrom: conditions.createdFrom });
    }
    if (conditions.createdTo) {
      qb.andWhere('task.createdAt <= :createdTo', { createdTo: conditions.createdTo });
    }

    // タグフィルタ
    if (conditions.tagIds && conditions.tagIds.length > 0) {
      qb.andWhere('tag.id IN (:...tagIds)', { tagIds: conditions.tagIds });
    }

    return qb;
  }
}
