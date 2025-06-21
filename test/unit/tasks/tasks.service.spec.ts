/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { CreateTaskDto } from '@/tasks/dto/create-task.dto';
import { TaskQueryDto } from '@/tasks/dto/task-query.dto';
import { UpdateTaskDto } from '@/tasks/dto/update-task.dto';
import { Task } from '@/tasks/entities/task.entity';
import { TasksService } from '@/tasks/tasks.service';
import { User } from '@/users/entities/user.entity';
import { TaskPriority, TaskStatus } from '@common/constants/app.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let tagRepository: jest.Mocked<Repository<Tag>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const createTestTask = (overrides: Partial<Task> = {}): Task => {
    const mockTask = {
      id: 'test-task-id',
      userId: 'test-user-id',
      title: 'テストタスク',
      description: 'テスト用のタスクです',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: null,
      completedAt: null,
      position: 0,
      taskTags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      markCompleted: jest.fn(),
      markUncompleted: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      updatePosition: jest.fn(),
      ...overrides,
    };

    Object.defineProperty(mockTask, 'isCompleted', {
      get: function (this: typeof mockTask) {
        return this.status === TaskStatus.DONE;
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'isArchived', {
      get: function (this: typeof mockTask) {
        return this.status === TaskStatus.ARCHIVED;
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'isOverdue', {
      get: function () {
        return false;
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'daysUntilDue', {
      get: function () {
        return null;
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'tags', {
      get: function () {
        return [];
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'tagNames', {
      get: function () {
        return [];
      },
      configurable: true,
    });
    Object.defineProperty(mockTask, 'priorityOrder', {
      get: function () {
        return 2;
      },
      configurable: true,
    });

    return mockTask as Task;
  };

  const createTestTag = (overrides: Partial<Tag> = {}): Tag => {
    return {
      id: 'test-tag-id',
      userId: 'test-user-id',
      name: 'テストタグ',
      color: '#3B82F6',
      description: 'テスト用のタグです',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Tag;
  };

  const createTestCreateTaskDto = (overrides: Partial<CreateTaskDto> = {}): CreateTaskDto => {
    const dto = new CreateTaskDto();
    Object.assign(dto, {
      title: 'テストタスク',
      description: 'テスト用のタスクです',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      position: 0,
      tagIds: [],
      validateBusinessRules: jest.fn().mockReturnValue([]),
      toCreateObject: jest.fn().mockReturnValue({
        title: 'テストタスク',
        description: 'テスト用のタスクです',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: undefined,
        position: 0,
        tagIds: [],
      }),
      ...overrides,
    });
    return dto;
  };

  const createTestUpdateTaskDto = (overrides: Partial<UpdateTaskDto> = {}): UpdateTaskDto => {
    const dto = new UpdateTaskDto();
    Object.assign(dto, {
      hasUpdates: jest.fn().mockReturnValue(true),
      validateBusinessRules: jest.fn().mockReturnValue([]),
      toUpdateObject: jest.fn().mockReturnValue({
        title: '更新されたタスク',
      }),
      ...overrides,
    });
    return dto;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskTag),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            exists: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    tagRepository = module.get(getRepositoryToken(Tag));
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('新規タスクを正常に作成できること', async () => {
      const userId = 'test-user-id';
      const createTaskDto = createTestCreateTaskDto();
      const savedTask = createTestTask();

      userRepository.exists.mockResolvedValue(true);

      // EntityManagerモック
      const mockManager = {
        create: jest.fn().mockReturnValue(savedTask),
        save: jest.fn().mockResolvedValue(savedTask),
        findOne: jest.fn().mockResolvedValue(savedTask),
      } as unknown as EntityManager;

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<unknown>) => {
          return await callback(mockManager);
        },
      );

      const result = await service.create(userId, createTaskDto);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(createTaskDto.validateBusinessRules).toHaveBeenCalled();
      expect(createTaskDto.toCreateObject).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.id).toBe(savedTask.id);
      expect(result.title).toBe(savedTask.title);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const createTaskDto = createTestCreateTaskDto();

      userRepository.exists.mockResolvedValue(false);

      await expect(service.create(userId, createTaskDto)).rejects.toThrow(ResourceNotFoundException);
      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
    });

    it('バリデーションエラーがある場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const createTaskDto = createTestCreateTaskDto({
        validateBusinessRules: jest.fn().mockReturnValue(['期限日が過去です']),
      });

      userRepository.exists.mockResolvedValue(true);

      await expect(service.create(userId, createTaskDto)).rejects.toThrow(BusinessLogicException);
      expect(createTaskDto.validateBusinessRules).toHaveBeenCalled();
    });

    it('タグIDが指定された場合、タグの存在確認が行われること', async () => {
      const userId = 'test-user-id';
      const tagId = 'test-tag-id';
      const createTaskDto = createTestCreateTaskDto({
        toCreateObject: jest.fn().mockReturnValue({
          title: 'テストタスク',
          description: 'テスト用のタスクです',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: undefined,
          position: 0,
          tagIds: [tagId],
        }),
      });
      const savedTask = createTestTask();
      const existingTag = createTestTag({ id: tagId });

      userRepository.exists.mockResolvedValue(true);
      tagRepository.find.mockResolvedValue([existingTag]);

      const mockManager = {
        create: jest.fn().mockReturnValue(savedTask),
        save: jest.fn().mockResolvedValue(savedTask),
        findOne: jest.fn().mockResolvedValue(savedTask),
      } as unknown as EntityManager;

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<unknown>) => {
          return await callback(mockManager);
        },
      );

      await service.create(userId, createTaskDto);

      expect(tagRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object) as unknown,
          userId,
          isActive: true,
        },
        select: ['id'],
      });
    });

    it('存在しないタグIDが指定された場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const createTaskDto = createTestCreateTaskDto({
        toCreateObject: jest.fn().mockReturnValue({
          title: 'テストタスク',
          description: 'テスト用のタスクです',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: undefined,
          position: 0,
          tagIds: ['non-existent-tag-id'],
        }),
      });

      userRepository.exists.mockResolvedValue(true);
      tagRepository.find.mockResolvedValue([]);

      await expect(service.create(userId, createTaskDto)).rejects.toThrow(BusinessLogicException);
    });
  });

  describe('findMany', () => {
    it('タスク一覧を正常に取得できること', async () => {
      const userId = 'test-user-id';
      const query = new TaskQueryDto();
      const tasks = [createTestTask(), createTestTask({ id: 'task-2' })];

      const mockQueryBuilder = {
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
      };

      userRepository.exists.mockResolvedValue(true);
      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);

      const result = await service.findMany(userId, query);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(taskRepository.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(result.tasks).toHaveLength(2);
      expect(result.meta.totalCount).toBe(2);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const query = new TaskQueryDto();

      userRepository.exists.mockResolvedValue(false);

      await expect(service.findMany(userId, query)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('findOne', () => {
    it('タスク詳細を正常に取得できること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const task = createTestTask();

      taskRepository.findOne.mockResolvedValue(task);

      const result = await service.findOne(taskId, userId);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId, userId },
        relations: ['taskTags', 'taskTags.tag'],
      });
      expect(result.id).toBe(task.id);
    });

    it('存在しないタスクIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const taskId = 'non-existent-task-id';
      const userId = 'test-user-id';

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId)).rejects.toThrow(ResourceNotFoundException);
    });

    it('他のユーザーのタスクにアクセスした場合、ResourceNotFoundExceptionが投げられること', async () => {
      const taskId = 'test-task-id';
      const userId = 'other-user-id';

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('update', () => {
    it('タスクを正常に更新できること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const updateTaskDto = createTestUpdateTaskDto();
      const existingTask = createTestTask();
      const updatedTask = createTestTask({ title: '更新されたタスク' });

      taskRepository.findOne.mockResolvedValue(existingTask);

      const mockManager = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(updatedTask),
      } as unknown as EntityManager;

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<unknown>) => {
          return await callback(mockManager);
        },
      );

      const result = await service.update(taskId, userId, updateTaskDto);

      expect(updateTaskDto.hasUpdates).toHaveBeenCalled();
      expect(updateTaskDto.validateBusinessRules).toHaveBeenCalled();
      expect(updateTaskDto.toUpdateObject).toHaveBeenCalled();
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId, userId },
        relations: ['taskTags', 'taskTags.tag'],
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.title).toBe('更新されたタスク');
    });

    it('更新対象がない場合、BusinessLogicExceptionが投げられること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const updateTaskDto = createTestUpdateTaskDto({
        hasUpdates: jest.fn().mockReturnValue(false),
      });

      await expect(service.update(taskId, userId, updateTaskDto)).rejects.toThrow(BusinessLogicException);
      expect(updateTaskDto.hasUpdates).toHaveBeenCalled();
    });

    it('バリデーションエラーがある場合、BusinessLogicExceptionが投げられること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const updateTaskDto = createTestUpdateTaskDto({
        validateBusinessRules: jest.fn().mockReturnValue(['エラーメッセージ']),
      });

      await expect(service.update(taskId, userId, updateTaskDto)).rejects.toThrow(BusinessLogicException);
      expect(updateTaskDto.validateBusinessRules).toHaveBeenCalled();
    });

    it('存在しないタスクIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const taskId = 'non-existent-task-id';
      const userId = 'test-user-id';
      const updateTaskDto = createTestUpdateTaskDto();

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.update(taskId, userId, updateTaskDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('markCompletedがtrueの場合、ステータスがDONEに更新されること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const updateTaskDto = createTestUpdateTaskDto({
        toUpdateObject: jest.fn().mockReturnValue({
          markCompleted: true,
        }),
      });
      const existingTask = createTestTask();
      const updatedTask = createTestTask({ status: TaskStatus.DONE });

      taskRepository.findOne.mockResolvedValue(existingTask);

      const mockManager = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(updatedTask),
      } as unknown as EntityManager;

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<unknown>) => {
          return await callback(mockManager);
        },
      );

      await service.update(taskId, userId, updateTaskDto);

      expect(mockManager.update).toHaveBeenCalledWith(
        Task,
        { id: taskId, userId },
        expect.objectContaining({
          status: TaskStatus.DONE,
          completedAt: expect.any(Date) as unknown as Date,
        }),
      );
    });
  });

  describe('remove', () => {
    it('タスクを正常に削除できること', async () => {
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const existingTask = createTestTask();

      taskRepository.findOne.mockResolvedValue(existingTask);
      taskRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.remove(taskId, userId);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId, userId },
        relations: ['taskTags', 'taskTags.tag'],
      });
      expect(taskRepository.delete).toHaveBeenCalledWith({ id: taskId, userId });
      expect(result.deletedId).toBe(taskId);
      expect(result.message).toBeDefined();
    });

    it('存在しないタスクIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const taskId = 'non-existent-task-id';
      const userId = 'test-user-id';

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(taskId, userId)).rejects.toThrow(ResourceNotFoundException);
      expect(taskRepository.delete).not.toHaveBeenCalled();
    });

    it('他のユーザーのタスクを削除しようとした場合、ResourceNotFoundExceptionが投げられること', async () => {
      const taskId = 'test-task-id';
      const userId = 'other-user-id';

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(taskId, userId)).rejects.toThrow(ResourceNotFoundException);
      expect(taskRepository.delete).not.toHaveBeenCalled();
    });
  });
});
