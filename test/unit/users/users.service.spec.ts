/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ChangeEmailDto,
  ChangePasswordDto,
  DeactivateAccountDto,
  UpdateUserProfileDto,
} from '@/users/dto/update-user.dto';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';
import { PasswordUtil } from '@common/utils/password.util';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let passwordUtil: jest.Mocked<PasswordUtil>;

  const createTestUser = (overrides: Partial<User> = {}): User => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      displayName: 'テストユーザー',
      avatarUrl: null,
      isActive: true,
      isVerified: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tasks: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      recordLoginSuccess: jest.fn(),
      recordLoginFailure: jest.fn(),
      validateFields: jest.fn(),
      ...overrides,
    };

    Object.defineProperty(mockUser, 'isLocked', {
      get: function (this: typeof mockUser) {
        if (!this.lockedUntil) {
          return false;
        }
        return new Date() < this.lockedUntil;
      },
      configurable: true,
    });
    Object.defineProperty(mockUser, 'canLogin', {
      get: function (this: typeof mockUser) {
        return this.isActive && !this.isLocked;
      },
      configurable: true,
    });

    return mockUser as User;
  };

  const createTestUpdateUserProfileDto = (overrides: Partial<UpdateUserProfileDto> = {}): UpdateUserProfileDto => {
    return Object.assign(new UpdateUserProfileDto(), {
      displayName: '更新されたユーザー',
      avatarUrl: 'https://example.com/new-avatar.jpg',
      ...overrides,
    });
  };

  const createTestChangePasswordDto = (overrides: Partial<ChangePasswordDto> = {}): ChangePasswordDto => {
    return Object.assign(new ChangePasswordDto(), {
      currentPassword: 'CurrentPass123',
      newPassword: 'NewSecurePass123',
      confirmPassword: 'NewSecurePass123',
      ...overrides,
    });
  };

  const createTestChangeEmailDto = (overrides: Partial<ChangeEmailDto> = {}): ChangeEmailDto => {
    return Object.assign(new ChangeEmailDto(), {
      newEmail: 'newemail@example.com',
      currentPassword: 'CurrentPass123',
      ...overrides,
    });
  };

  const createTestDeactivateAccountDto = (overrides: Partial<DeactivateAccountDto> = {}): DeactivateAccountDto => {
    return Object.assign(new DeactivateAccountDto(), {
      currentPassword: 'CurrentPass123',
      reason: 'テスト用の無効化',
      ...overrides,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PasswordUtil,
          useValue: {
            verifyPassword: jest.fn(),
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    passwordUtil = module.get(PasswordUtil);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを正常に取得できること', async () => {
      const email = 'test@example.com';
      const user = createTestUser({ email });

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email, isActive: true },
        select: [
          'id',
          'email',
          'displayName',
          'avatarUrl',
          'passwordHash',
          'isActive',
          'isVerified',
          'failedLoginAttempts',
          'lockedUntil',
          'lastLoginAt',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(result).toBe(user);
    });

    it('存在しないメールアドレスの場合、nullを返すこと', async () => {
      const email = 'nonexistent@example.com';

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });

    it('データベースエラーが発生した場合、nullを返すこと', async () => {
      const email = 'test@example.com';

      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('プロフィールを正常に更新できること', async () => {
      const userId = 'test-user-id';
      const updateDto = createTestUpdateUserProfileDto();
      const existingUser = createTestUser();
      const updatedUser = createTestUser({
        displayName: '更新されたユーザー',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
        select: [
          'id',
          'email',
          'displayName',
          'avatarUrl',
          'isActive',
          'isVerified',
          'lastLoginAt',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(userRepository.save).toHaveBeenCalledWith(existingUser);
      expect(result).toBe(updatedUser);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const updateDto = createTestUpdateUserProfileDto();

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('無効な表示名の場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const updateDto = createTestUpdateUserProfileDto({ displayName: 'a' }); // 短すぎる
      const existingUser = createTestUser();

      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(BusinessLogicException);
    });

    it('avatarUrlのみを更新できること', async () => {
      const userId = 'test-user-id';
      const updateDto = createTestUpdateUserProfileDto();
      delete updateDto.displayName; // displayNameプロパティを削除
      const existingUser = createTestUser();
      const updatedUser = createTestUser({ avatarUrl: 'https://example.com/new-avatar.jpg' });

      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });

    it('空文字列のavatarUrlはnullに変換されること', async () => {
      const userId = 'test-user-id';
      const updateDto = createTestUpdateUserProfileDto({ avatarUrl: '   ' });
      const existingUser = createTestUser();
      const updatedUser = createTestUser({ avatarUrl: null });

      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, updateDto);

      expect(existingUser.avatarUrl).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('パスワードを正常に変更できること', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = createTestChangePasswordDto();
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      passwordUtil.verifyPassword.mockResolvedValue(true);
      passwordUtil.hashPassword.mockResolvedValue('new_hashed_password');
      userRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.changePassword(userId, changePasswordDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'passwordHash'],
      });
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(changePasswordDto.currentPassword, user.passwordHash);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(changePasswordDto.newPassword);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        passwordHash: 'new_hashed_password',
      });
    });

    it('パスワード確認が一致しない場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = createTestChangePasswordDto({
        confirmPassword: 'DifferentPassword123',
      });

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('弱いパスワードの場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = createTestChangePasswordDto({
        newPassword: 'password',
        confirmPassword: 'password',
      });

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(passwordUtil.verifyPassword).not.toHaveBeenCalled();
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const changePasswordDto = createTestChangePasswordDto();

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('現在のパスワードが間違っている場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const changePasswordDto = createTestChangePasswordDto();
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      passwordUtil.verifyPassword.mockResolvedValue(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(BusinessLogicException);
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    it('メールアドレスを正常に変更できること', async () => {
      const userId = 'test-user-id';
      const changeEmailDto = createTestChangeEmailDto();
      const user = createTestUser();
      const updatedUser = createTestUser({
        email: changeEmailDto.newEmail,
        isVerified: false,
      });

      userRepository.findOne.mockResolvedValueOnce(user); // ユーザー取得
      userRepository.findOne.mockResolvedValueOnce(null); // 重複チェック
      passwordUtil.verifyPassword.mockResolvedValue(true);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.changeEmail(userId, changeEmailDto);

      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(changeEmailDto.currentPassword, user.passwordHash);
      expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: changeEmailDto.newEmail },
        select: ['id'],
      });
      expect(result.email).toBe(changeEmailDto.newEmail);
      expect(result.isVerified).toBe(false);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const changeEmailDto = createTestChangeEmailDto();

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.changeEmail(userId, changeEmailDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('パスワードが間違っている場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const changeEmailDto = createTestChangeEmailDto();
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      passwordUtil.verifyPassword.mockResolvedValue(false);

      await expect(service.changeEmail(userId, changeEmailDto)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('メールアドレスが既に使用されている場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const changeEmailDto = createTestChangeEmailDto();
      const user = createTestUser();
      const existingUser = createTestUser({ id: 'other-user-id', email: changeEmailDto.newEmail });

      userRepository.findOne.mockResolvedValueOnce(user); // ユーザー取得
      userRepository.findOne.mockResolvedValueOnce(existingUser); // 重複チェック
      passwordUtil.verifyPassword.mockResolvedValue(true);

      await expect(service.changeEmail(userId, changeEmailDto)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('同じユーザーが同じメールアドレスに変更する場合は許可されること', async () => {
      const userId = 'test-user-id';
      const changeEmailDto = createTestChangeEmailDto();
      const user = createTestUser();
      const sameUser = createTestUser({ id: userId, email: changeEmailDto.newEmail });

      userRepository.findOne.mockResolvedValueOnce(user); // ユーザー取得
      userRepository.findOne.mockResolvedValueOnce(sameUser); // 重複チェック（同じユーザー）
      passwordUtil.verifyPassword.mockResolvedValue(true);
      userRepository.save.mockResolvedValue(user);

      const result = await service.changeEmail(userId, changeEmailDto);

      expect(result).toBeDefined();
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('deactivateAccount', () => {
    it('アカウントを正常に無効化できること', async () => {
      const userId = 'test-user-id';
      const deactivateDto = createTestDeactivateAccountDto();
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      passwordUtil.verifyPassword.mockResolvedValue(true);
      userRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.deactivateAccount(userId, deactivateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'passwordHash'],
      });
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(deactivateDto.currentPassword, user.passwordHash);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non-existent-user-id';
      const deactivateDto = createTestDeactivateAccountDto();

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deactivateAccount(userId, deactivateDto)).rejects.toThrow(ResourceNotFoundException);
    });

    it('パスワードが間違っている場合、BusinessLogicExceptionが投げられること', async () => {
      const userId = 'test-user-id';
      const deactivateDto = createTestDeactivateAccountDto();
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      passwordUtil.verifyPassword.mockResolvedValue(false);

      await expect(service.deactivateAccount(userId, deactivateDto)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('handleLoginFailure', () => {
    it('ログイン失敗を正常に記録できること', async () => {
      const email = 'test@example.com';
      const user = createTestUser({ email });

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.handleLoginFailure(email);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        select: ['id', 'failedLoginAttempts', 'lockedUntil'],
      });
      expect(user.recordLoginFailure).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('存在しないユーザーの場合、エラーを発生させないこと', async () => {
      const email = 'nonexistent@example.com';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.handleLoginFailure(email)).resolves.not.toThrow();
    });

    it('データベースエラーが発生してもエラーを発生させないこと', async () => {
      const email = 'test@example.com';

      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.handleLoginFailure(email)).resolves.not.toThrow();
    });
  });

  describe('handleLoginSuccess', () => {
    it('ログイン成功を正常に記録できること', async () => {
      const userId = 'test-user-id';
      const user = createTestUser();

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.handleLoginSuccess(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'failedLoginAttempts', 'lockedUntil', 'lastLoginAt'],
      });
      expect(user.recordLoginSuccess).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('存在しないユーザーの場合、エラーを発生させないこと', async () => {
      const userId = 'non-existent-user-id';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.handleLoginSuccess(userId)).resolves.not.toThrow();
    });

    it('データベースエラーが発生してもエラーを発生させないこと', async () => {
      const userId = 'test-user-id';

      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.handleLoginSuccess(userId)).resolves.not.toThrow();
    });
  });
});
