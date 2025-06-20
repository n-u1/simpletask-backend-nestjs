/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthService } from '@/auth/auth.service';
import { User } from '@/users/entities/user.entity';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';
import { PasswordUtil } from '@common/utils/password.util';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let passwordUtil: jest.Mocked<PasswordUtil>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: PasswordUtil,
          useValue: {
            hashPassword: jest.fn(),
            verifyPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    passwordUtil = module.get(PasswordUtil);

    configService.getOrThrow.mockImplementation((key: string) => {
      const config: Record<string, any> = {
        'jwt.accessTokenExpire': 30,
        'jwt.refreshTokenExpire': 30,
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('新規ユーザーを正常に登録できること', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'テストユーザー',
      };
      const hashedPassword = 'hashed_password';
      const savedUser = createTestUser({
        email: registerData.email,
        displayName: registerData.displayName,
        passwordHash: hashedPassword,
      });

      userRepository.findOne.mockResolvedValue(null);
      passwordUtil.hashPassword.mockResolvedValue(hashedPassword);
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(registerData);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
        select: ['id', 'email'],
      });
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerData.email,
        passwordHash: hashedPassword,
        displayName: registerData.displayName,
        avatarUrl: null,
        isActive: true,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedUser);
    });

    it('avatarUrlが指定された場合、正常に設定されること', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const registerData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'テストユーザー',
        avatarUrl,
      };
      const savedUser = createTestUser();

      userRepository.findOne.mockResolvedValue(null);
      passwordUtil.hashPassword.mockResolvedValue('hashed_password');
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);

      await service.register(registerData);

      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerData.email,
        passwordHash: 'hashed_password',
        displayName: registerData.displayName,
        avatarUrl: avatarUrl,
        isActive: true,
      });
    });

    it('メールアドレスが既に存在する場合、BusinessLogicExceptionが投げられること', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'テストユーザー',
      };
      const existingUser = createTestUser({ email: registerData.email });

      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerData)).rejects.toThrow(BusinessLogicException);
    });

    it('無効な表示名の場合、BusinessLogicExceptionが投げられること', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        displayName: 'a',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerData)).rejects.toThrow(BusinessLogicException);
    });

    it('弱いパスワードの場合、BusinessLogicExceptionが投げられること', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password',
        displayName: 'テストユーザー',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerData)).rejects.toThrow(BusinessLogicException);
    });
  });

  describe('login', () => {
    it('正しい認証情報でログインできること', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };
      const userData = createTestUser({
        email: loginData.email,
        passwordHash: 'hashed_password',
      });
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      userRepository.findOne.mockResolvedValue(userData);
      passwordUtil.verifyPassword.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValueOnce(accessToken).mockResolvedValueOnce(refreshToken);

      const result = await service.login(loginData);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email, isActive: true },
        select: ['id', 'email', 'passwordHash', 'displayName', 'avatarUrl', 'isActive'],
      });
      expect(passwordUtil.verifyPassword).toHaveBeenCalledWith(loginData.password, userData.passwordHash);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
      expect(result.tokenType).toBe('Bearer');
      expect(result.user.id).toBe(userData.id);
      expect(result.user.email).toBe(userData.email);
    });

    it('存在しないメールアドレスの場合、BusinessLogicExceptionが投げられること', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(BusinessLogicException);
    });

    it('間違ったパスワードの場合、BusinessLogicExceptionが投げられること', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong_password',
      };
      const userData = createTestUser({
        email: loginData.email,
        passwordHash: 'hashed_password',
      });

      userRepository.findOne.mockResolvedValue(userData);
      passwordUtil.verifyPassword.mockResolvedValue(false);

      await expect(service.login(loginData)).rejects.toThrow(BusinessLogicException);
    });
  });

  describe('refreshToken', () => {
    it('有効なユーザーでトークンを更新できること', async () => {
      const userData = createTestUser();
      const accessToken = 'new_access_token';
      const refreshToken = 'new_refresh_token';

      userRepository.findOne.mockResolvedValue(userData);
      jwtService.signAsync.mockResolvedValueOnce(accessToken).mockResolvedValueOnce(refreshToken);

      const result = await service.refreshToken(userData);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userData.id, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive'],
      });
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
      expect(result.user.id).toBe(userData.id);
    });

    it('存在しないユーザーの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userData = createTestUser();

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(userData)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('validateUser', () => {
    it('正しい認証情報の場合、ユーザー情報を返すこと', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const userData = createTestUser({
        email,
        passwordHash: 'hashed_password',
      });

      userRepository.findOne.mockResolvedValue(userData);
      passwordUtil.verifyPassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(userData.id);
      expect(result?.email).toBe(userData.email);
    });

    it('存在しないユーザーの場合、nullを返すこと', async () => {
      const email = 'nonexistent@example.com';
      const password = 'TestPassword123!';

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('間違ったパスワードの場合、nullを返すこと', async () => {
      const email = 'test@example.com';
      const password = 'wrong_password';
      const userData = createTestUser({
        email,
        passwordHash: 'hashed_password',
      });

      userRepository.findOne.mockResolvedValue(userData);
      passwordUtil.verifyPassword.mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('存在するユーザーIDの場合、ユーザー情報を返すこと', async () => {
      const userData = createTestUser();

      userRepository.findOne.mockResolvedValue(userData);

      const result = await service.getUserById(userData.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userData.id, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(userData);
    });

    it('存在しないユーザーIDの場合、ResourceNotFoundExceptionが投げられること', async () => {
      const userId = 'non_existent_id';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(ResourceNotFoundException);
    });
  });
});
