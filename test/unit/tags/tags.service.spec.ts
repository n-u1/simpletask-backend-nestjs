/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTagDto } from '@/tags/dto/create-tag.dto';
import { TagQueryDto } from '@/tags/dto/tag-query.dto';
import { UpdateTagDto } from '@/tags/dto/update-tag.dto';
import { Tag } from '@/tags/entities/tag.entity';
import { TagsService } from '@/tags/tags.service';
import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

describe('TagsService', () => {
  let service: TagsService;
  let tagRepository: jest.Mocked<Repository<Tag>>;
  let taskTagRepository: jest.Mocked<Repository<TaskTag>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const createTestTag = (overrides: Partial<Tag> = {}): Tag => {
    const mockTag = {
      id: 'test-tag-id',
      userId: 'test-user-id',
      name: 'テストタグ',
      color: '#3B82F6',
      description: 'テスト用のタグです',
      isActive: true,
      taskTags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      updateColor: jest.fn(),
      ...overrides,
    };

    Object.defineProperty(mockTag, 'tasks', {
      get: function () {
        return [];
      },
      configurable: true,
    });
    Object.defineProperty(mockTag, 'colorRgb', {
      get: function () {
        return [59, 130, 246] as [number, number, number];
      },
      configurable: true,
    });
    Object.defineProperty(mockTag, 'colorHsl', {
      get: function () {
        return [217, 91, 60] as [number, number, number];
      },
      configurable: true,
    });
    Object.defineProperty(mockTag, 'isPresetColor', {
      get: function () {
        return true;
      },
      configurable: true,
    });
    Object.defineProperty(mockTag, 'isDarkColor', {
      get: function () {
        return false;
      },
      configurable: true,
    });
    Object.defineProperty(mockTag, 'contrastTextColor', {
      get: function () {
        return '#000000';
      },
      configurable: true,
    });

    return mockTag as Tag;
  };

  const createTestCreateTagDto = (overrides: Partial<CreateTagDto> = {}): CreateTagDto => {
    const dto = new CreateTagDto();
    Object.assign(dto, {
      name: 'テストタグ',
      color: '#3B82F6',
      description: 'テスト用のタグです',
      validateBusinessRules: jest.fn().mockReturnValue([]),
      toCreateObject: jest.fn().mockReturnValue({
        name: 'テストタグ',
        color: '#3B82F6',
        description: 'テスト用のタグです',
      }),
      isValidColor: jest.fn().mockReturnValue(true),
      isPresetColor: jest.fn().mockReturnValue(true),
      ...overrides,
    });
    return dto;
  };

  const createTestUpdateTagDto = (overrides: Partial<UpdateTagDto> = {}): UpdateTagDto => {
    const dto = new UpdateTagDto();
    Object.assign(dto, {
      name: '更新されたタグ',
      hasUpdates: jest.fn().mockReturnValue(true),
      validateBusinessRules: jest.fn().mockReturnValue([]),
      toUpdateObject: jest.fn().mockReturnValue({
        name: '更新されたタグ',
      }),
      hasNameUpdate: jest.fn().mockReturnValue(true),
      hasColorUpdate: jest.fn().mockReturnValue(false),
      hasActiveStatusUpdate: jest.fn().mockReturnValue(false),
      ...overrides,
    });
    return dto;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskTag),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            exists: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagRepository = module.get(getRepositoryToken(Tag));
    taskTagRepository = module.get(getRepositoryToken(TaskTag));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('新規タグを正常に作成できること', async () => {
      const userId = 'test-user-id';
      const createTagDto = createTestCreateTagDto();
      const savedTag = createTestTag();

      userRepository.exists.mockResolvedValue(true);
      tagRepository.findOne.mockResolvedValue(null); // 重複なし
      tagRepository.create.mockReturnValue(savedTag);
      tagRepository.save.mockResolvedValue(savedTag);

      const result = await service.create(userId, createTagDto);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(createTagDto.validateBusinessRules).toHaveBeenCalled();
      expect(createTagDto.toCreateObject).toHaveBeenCalled();
      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { userId, name: createTagDto.name, isActive: true },
        select: ['id'],
      });
      expect(tagRepository.create).toHaveBeenCalledWith({
        userId,
        name: 'テストタグ',
        color: '#3B82F6',
        description: 'テスト用のタグです',
        isActive: true,
      });
      expect(tagRepository.save).toHaveBeenCalledWith(savedTag);
      expect(result.id).toBe(savedTag.id);
      expect(result.name).toBe(savedTag.name);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const createTagDto = createTestCreateTagDto();

      userRepository.exists.mockResolvedValue(false);

      await expect(service.create(userId, createTagDto)).rejects.toThrow(ResourceNotFoundException);
      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
    });

    it('バリデーションエラーがある場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const createTagDto = createTestCreateTagDto({
        validateBusinessRules: jest.fn().mockReturnValue(['無効な文字が含まれています']),
      });

      userRepository.exists.mockResolvedValue(true);

      await expect(service.create(userId, createTagDto)).rejects.toThrow(BusinessLogicException);
      expect(createTagDto.validateBusinessRules).toHaveBeenCalled();
    });

    it('重複するタグ名の場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const createTagDto = createTestCreateTagDto();
      const existingTag = createTestTag({ name: createTagDto.name });

      userRepository.exists.mockResolvedValue(true);
      tagRepository.findOne.mockResolvedValue(existingTag);

      await expect(service.create(userId, createTagDto)).rejects.toThrow(BusinessLogicException);
      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { userId, name: createTagDto.name, isActive: true },
        select: ['id'],
      });
    });
  });

  describe('findMany', () => {
    it('タグ一覧を正常に取得できること', async () => {
      const userId = 'test-user-id';
      const query = new TagQueryDto();
      const tags = [createTestTag(), createTestTag({ id: 'tag-2', name: 'タグ2' })];

      const mockQueryBuilder = {
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tags),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
      };

      userRepository.exists.mockResolvedValue(true);
      tagRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as never);

      const result = await service.findMany(userId, query);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(tagRepository.createQueryBuilder).toHaveBeenCalledWith('tag');
      expect(result.tags).toHaveLength(2);
      expect(result.meta.totalCount).toBe(2);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const query = new TagQueryDto();

      userRepository.exists.mockResolvedValue(false);

      await expect(service.findMany(userId, query)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('findOne', () => {
    it('タグ詳細を正常に取得できること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const tag = createTestTag();

      tagRepository.findOne.mockResolvedValue(tag);

      const result = await service.findOne(tagId, userId);

      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(result.id).toBe(tag.id);
      expect(result.name).toBe(tag.name);
    });

    it('存在しないタグIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const tagId = 'non-existent-tag-id';
      const userId = 'test-user-id';

      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tagId, userId)).rejects.toThrow(ResourceNotFoundException);
      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
    });

    it('他のユーザーのタグにアクセスした場合、ResourceNotFoundExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'other-user-id';

      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tagId, userId)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('update', () => {
    it('タグを正常に更新できること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto({
        name: '更新されたタグ',
        toUpdateObject: jest.fn().mockReturnValue({
          name: '更新されたタグ',
        }),
        hasNameUpdate: jest.fn().mockReturnValue(true),
      });
      const existingTag = createTestTag({ name: '元のタグ名' });
      const updatedTag = createTestTag({ name: '更新されたタグ' });

      // 3回のfindOne呼び出しを正しい順序でモック
      tagRepository.findOne
        .mockResolvedValueOnce(existingTag) // 1回目: 存在確認
        .mockResolvedValueOnce(null) // 2回目: 重複チェック（重複なし）
        .mockResolvedValueOnce(updatedTag); // 3回目: 更新後取得

      tagRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.update(tagId, userId, updateTagDto);

      expect(updateTagDto.hasUpdates).toHaveBeenCalled();
      expect(updateTagDto.validateBusinessRules).toHaveBeenCalled();
      expect(updateTagDto.hasNameUpdate).toHaveBeenCalled();
      expect(updateTagDto.toUpdateObject).toHaveBeenCalled();

      // 存在確認の呼び出し
      expect(tagRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: tagId, userId },
      });

      // 重複チェックの呼び出し
      expect(tagRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { userId, name: '更新されたタグ', isActive: true },
        select: ['id'],
      });

      expect(tagRepository.update).toHaveBeenCalledWith({ id: tagId, userId }, { name: '更新されたタグ' });
      expect(result.name).toBe('更新されたタグ');
    });

    it('更新対象がない場合、BusinessLogicExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto({
        hasUpdates: jest.fn().mockReturnValue(false),
      });

      await expect(service.update(tagId, userId, updateTagDto)).rejects.toThrow(BusinessLogicException);
      expect(updateTagDto.hasUpdates).toHaveBeenCalled();
    });

    it('バリデーションエラーがある場合、BusinessLogicExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto({
        validateBusinessRules: jest.fn().mockReturnValue(['エラーメッセージ']),
      });

      await expect(service.update(tagId, userId, updateTagDto)).rejects.toThrow(BusinessLogicException);
      expect(updateTagDto.validateBusinessRules).toHaveBeenCalled();
    });

    it('存在しないタグIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const tagId = 'non-existent-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto();

      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.update(tagId, userId, updateTagDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('タグ名を変更する場合、重複チェックが行われること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto({
        name: '新しいタグ名',
        hasNameUpdate: jest.fn().mockReturnValue(true),
      });
      const existingTag = createTestTag({ name: '既存のタグ名' });
      const updatedTag = createTestTag({ name: '新しいタグ名' });

      tagRepository.findOne.mockResolvedValueOnce(existingTag); // 存在確認
      tagRepository.findOne.mockResolvedValueOnce(null); // 重複チェック
      tagRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      tagRepository.findOne.mockResolvedValueOnce(updatedTag); // 更新後取得

      await service.update(tagId, userId, updateTagDto);

      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { userId, name: '新しいタグ名', isActive: true },
        select: ['id'],
      });
    });

    it('タグ名が重複する場合、BusinessLogicExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const updateTagDto = createTestUpdateTagDto({
        name: '重複するタグ名',
        hasNameUpdate: jest.fn().mockReturnValue(true),
      });
      const existingTag = createTestTag({ name: '既存のタグ名' });
      const duplicateTag = createTestTag({ id: 'other-tag-id', name: '重複するタグ名' });

      tagRepository.findOne.mockResolvedValueOnce(existingTag); // 存在確認
      tagRepository.findOne.mockResolvedValueOnce(duplicateTag); // 重複チェック

      await expect(service.update(tagId, userId, updateTagDto)).rejects.toThrow(BusinessLogicException);
    });
  });

  describe('remove', () => {
    it('タグを正常に削除できること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const existingTag = createTestTag();

      tagRepository.findOne.mockResolvedValue(existingTag);
      taskTagRepository.count.mockResolvedValue(0); // 使用中ではない
      tagRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.remove(tagId, userId);

      expect(tagRepository.findOne).toHaveBeenCalledWith({
        where: { id: tagId, userId },
      });
      expect(taskTagRepository.count).toHaveBeenCalledWith({
        where: { tagId },
      });
      expect(tagRepository.delete).toHaveBeenCalledWith({ id: tagId, userId });
      expect(result.deletedId).toBe(tagId);
      expect(result.message).toBeDefined();
    });

    it('存在しないタグIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const tagId = 'non-existent-tag-id';
      const userId = 'test-user-id';

      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tagId, userId)).rejects.toThrow(ResourceNotFoundException);
      expect(taskTagRepository.count).not.toHaveBeenCalled();
      expect(tagRepository.delete).not.toHaveBeenCalled();
    });

    it('使用中のタグの場合、BusinessLogicExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'test-user-id';
      const existingTag = createTestTag();

      tagRepository.findOne.mockResolvedValue(existingTag);
      taskTagRepository.count.mockResolvedValue(3); // 3個のタスクで使用中

      await expect(service.remove(tagId, userId)).rejects.toThrow(BusinessLogicException);
      expect(taskTagRepository.count).toHaveBeenCalledWith({
        where: { tagId },
      });
      expect(tagRepository.delete).not.toHaveBeenCalled();
    });

    it('他のユーザーのタグを削除しようとした場合、ResourceNotFoundExceptionが投げられること', async () => {
      const tagId = 'test-tag-id';
      const userId = 'other-user-id';

      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tagId, userId)).rejects.toThrow(ResourceNotFoundException);
      expect(taskTagRepository.count).not.toHaveBeenCalled();
      expect(tagRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAllActive', () => {
    it('アクティブなタグ一覧を正常に取得できること', async () => {
      const userId = 'test-user-id';
      const activeTags = [createTestTag({ name: 'タグ1' }), createTestTag({ id: 'tag-2', name: 'タグ2' })];

      userRepository.exists.mockResolvedValue(true);
      tagRepository.find.mockResolvedValue(activeTags);

      const result = await service.findAllActive(userId);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
      });
      expect(tagRepository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('タグ1');
      expect(result[1]?.name).toBe('タグ2');
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';

      userRepository.exists.mockResolvedValue(false);

      await expect(service.findAllActive(userId)).rejects.toThrow(ResourceNotFoundException);
      expect(tagRepository.find).not.toHaveBeenCalled();
    });

    it('アクティブなタグが存在しない場合、空配列を返すこと', async () => {
      const userId = 'test-user-id';

      userRepository.exists.mockResolvedValue(true);
      tagRepository.find.mockResolvedValue([]);

      const result = await service.findAllActive(userId);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});
