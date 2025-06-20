/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtPayload, JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { User } from '@/users/entities/user.entity';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<Repository<User>>;

  const createTestUser = (overrides: Partial<User> = {}): User => {
    return {
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
      ...overrides,
    } as User;
  };

  const createTestJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => {
    return {
      sub: 'test-user-id',
      type: 'access',
      jti: 'test-jti',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    };
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config = {
        'jwt.secret': 'test_secret_key_for_testing_only_minimum_32_characters_long',
        'jwt.algorithm': 'HS256',
      };
      return config[key as keyof typeof config];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('validate', () => {
    it('有効なアクセストークンペイロードでユーザー情報を返すこと', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
      });

      userRepository.findOne.mockResolvedValue(userData);

      const result = await strategy.validate(payload);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(userData);
    });

    it('subが欠けているペイロードの場合、BusinessLogicExceptionが投げられること', async () => {
      const payload = createTestJwtPayload({
        sub: undefined as unknown as string,
        type: 'access',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('typeが欠けているペイロードの場合、BusinessLogicExceptionが投げられること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: undefined as unknown as 'access',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('jtiが欠けているペイロードの場合、BusinessLogicExceptionが投げられること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
        jti: undefined as unknown as string,
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('refreshトークンタイプの場合、BusinessLogicExceptionが投げられること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'refresh',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('無効なトークンタイプの場合、BusinessLogicExceptionが投げられること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'invalid' as unknown as 'access',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const payload = createTestJwtPayload({
        sub: 'non_existent_user_id',
        type: 'access',
      });

      userRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(ResourceNotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });
    });

    it('データベースエラーが発生した場合、エラーが再投げされること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
      });

      const dbError = new Error('Database connection failed');
      userRepository.findOne.mockRejectedValue(dbError);

      await expect(strategy.validate(payload)).rejects.toThrow(dbError);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('空文字列のsubの場合、BusinessLogicExceptionが投げられること', async () => {
      const payload = createTestJwtPayload({
        sub: '',
        type: 'access',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('空文字列のjtiの場合、BusinessLogicExceptionが投げられること', async () => {
      const userData = createTestUser();
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
        jti: '',
      });

      await expect(strategy.validate(payload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('正常なアクティブユーザーのパスワードハッシュが結果に含まれないこと', async () => {
      const userData = createTestUser({
        passwordHash: 'hashed_password',
      });
      const payload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
      });

      userRepository.findOne.mockResolvedValue(userData);

      const result = await strategy.validate(payload);

      expect(result).toEqual(userData);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });
    });

    it('予期しないペイロード構造でもエラーハンドリングされること', async () => {
      const invalidPayload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as JwtPayload;

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(BusinessLogicException);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('期限切れのペイロードでも基本検証が行われること', async () => {
      const userData = createTestUser();
      const expiredPayload = createTestJwtPayload({
        sub: userData.id,
        type: 'access',
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      userRepository.findOne.mockResolvedValue(userData);

      const result = await strategy.validate(expiredPayload);

      expect(result).toEqual(userData);
    });
  });
});
