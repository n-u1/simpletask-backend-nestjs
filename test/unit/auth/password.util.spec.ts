/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';

import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { PasswordUtil } from '@common/utils/password.util';

import { TEST_CONSTANTS } from '../../fixtures/test-data';

jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('PasswordUtil', () => {
  let passwordUtil: PasswordUtil;
  let configService: jest.Mocked<ConfigService>;

  const mockArgon2Config = {
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 1,
    hashLength: 32,
  };

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordUtil,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    passwordUtil = module.get<PasswordUtil>(PasswordUtil);
    configService = module.get(ConfigService);

    configService.getOrThrow.mockImplementation((key: string) => {
      const configMap: Record<string, any> = {
        'argon2.timeCost': mockArgon2Config.timeCost,
        'argon2.memoryCost': mockArgon2Config.memoryCost,
        'argon2.parallelism': mockArgon2Config.parallelism,
        'argon2.hashLength': mockArgon2Config.hashLength,
      };
      return configMap[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('有効なArgon2設定で正常に初期化されること', () => {
      expect(configService.getOrThrow).toHaveBeenCalledWith('argon2.timeCost');
      expect(configService.getOrThrow).toHaveBeenCalledWith('argon2.memoryCost');
      expect(configService.getOrThrow).toHaveBeenCalledWith('argon2.parallelism');
      expect(configService.getOrThrow).toHaveBeenCalledWith('argon2.hashLength');
    });

    it('無効なtimeCost設定の場合、エラーが投げられること', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'argon2.timeCost') {
          return 0;
        }
        return mockArgon2Config[key.split('.')[1] as keyof typeof mockArgon2Config];
      });

      expect(() => {
        new PasswordUtil(configService);
      }).toThrow('Invalid Argon2 configuration');
    });

    it('無効なmemoryCost設定の場合、エラーが投げられること', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'argon2.memoryCost') {
          return 500;
        }
        return mockArgon2Config[key.split('.')[1] as keyof typeof mockArgon2Config];
      });

      expect(() => {
        new PasswordUtil(configService);
      }).toThrow('Invalid Argon2 configuration');
    });

    it('無効なparallelism設定の場合、エラーが投げられること', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'argon2.parallelism') {
          return 0;
        }
        return mockArgon2Config[key.split('.')[1] as keyof typeof mockArgon2Config];
      });

      expect(() => {
        new PasswordUtil(configService);
      }).toThrow('Invalid Argon2 configuration');
    });

    it('無効なhashLength設定の場合、エラーが投げられること', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'argon2.hashLength') {
          return 8;
        }
        return mockArgon2Config[key.split('.')[1] as keyof typeof mockArgon2Config];
      });

      expect(() => {
        new PasswordUtil(configService);
      }).toThrow('Invalid Argon2 configuration');
    });
  });

  describe('hashPassword', () => {
    beforeEach(() => {
      passwordUtil = new PasswordUtil(configService);
    });

    it('有効なパスワードを正常にハッシュ化できること', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const expectedHash = '$argon2id$v=19$m=65536,t=3,p=1$hash';

      mockedArgon2.hash.mockResolvedValue(expectedHash);

      const result = await passwordUtil.hashPassword(password);

      expect(mockedArgon2.hash).toHaveBeenCalledWith(password, {
        type: argon2.argon2id,
        timeCost: mockArgon2Config.timeCost,
        memoryCost: mockArgon2Config.memoryCost,
        parallelism: mockArgon2Config.parallelism,
        hashLength: mockArgon2Config.hashLength,
      });
      expect(result).toBe(expectedHash);
    });

    it('空文字列のパスワードも処理できること', async () => {
      const password = '';
      const expectedHash = '$argon2id$v=19$m=65536,t=3,p=1$empty_hash';

      mockedArgon2.hash.mockResolvedValue(expectedHash);

      const result = await passwordUtil.hashPassword(password);

      expect(mockedArgon2.hash).toHaveBeenCalledWith(password, expect.any(Object));
      expect(result).toBe(expectedHash);
    });

    it('長いパスワードを処理できること', async () => {
      const longPassword = 'a'.repeat(1000);
      const expectedHash = '$argon2id$v=19$m=65536,t=3,p=1$long_hash';

      mockedArgon2.hash.mockResolvedValue(expectedHash);

      const result = await passwordUtil.hashPassword(longPassword);

      expect(mockedArgon2.hash).toHaveBeenCalledWith(longPassword, expect.any(Object));
      expect(result).toBe(expectedHash);
    });

    it('特殊文字を含むパスワードを処理できること', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const expectedHash = '$argon2id$v=19$m=65536,t=3,p=1$special_hash';

      mockedArgon2.hash.mockResolvedValue(expectedHash);

      const result = await passwordUtil.hashPassword(specialPassword);

      expect(mockedArgon2.hash).toHaveBeenCalledWith(specialPassword, expect.any(Object));
      expect(result).toBe(expectedHash);
    });

    it('Argon2のハッシュ化でエラーが発生した場合、BusinessLogicExceptionが投げられること', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;

      mockedArgon2.hash.mockRejectedValue(new Error('Argon2 error'));

      await expect(passwordUtil.hashPassword(password)).rejects.toThrow(BusinessLogicException);
      expect(mockedArgon2.hash).toHaveBeenCalledWith(password, expect.any(Object));
    });
  });

  describe('verifyPassword', () => {
    beforeEach(() => {
      passwordUtil = new PasswordUtil(configService);
    });

    it('正しいパスワードの場合、trueを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$valid_hash';

      mockedArgon2.verify.mockResolvedValue(true);

      const result = await passwordUtil.verifyPassword(password, hash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(hash, password);
      expect(result).toBe(true);
    });

    it('間違ったパスワードの場合、falseを返すこと', async () => {
      const password = 'wrong_password';
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$valid_hash';

      mockedArgon2.verify.mockResolvedValue(false);

      const result = await passwordUtil.verifyPassword(password, hash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(hash, password);
      expect(result).toBe(false);
    });

    it('空のパスワードの場合、falseを返すこと', async () => {
      const password = '';
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$valid_hash';

      const result = await passwordUtil.verifyPassword(password, hash);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('空のハッシュの場合、falseを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const hash = '';

      const result = await passwordUtil.verifyPassword(password, hash);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('nullパスワードの場合、falseを返すこと', async () => {
      const password = null;
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$valid_hash';

      const result = await passwordUtil.verifyPassword(password as unknown as string, hash);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('nullハッシュの場合、falseを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const hash = null;

      const result = await passwordUtil.verifyPassword(password, hash as unknown as string);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('無効なハッシュ形式の場合、falseを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const invalidHash = 'invalid_hash_format';

      const result = await passwordUtil.verifyPassword(password, invalidHash);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('異なるハッシュ形式の場合、falseを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const bcryptHash = '$2b$10$hash';

      const result = await passwordUtil.verifyPassword(password, bcryptHash);

      expect(mockedArgon2.verify).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('Argon2の検証でエラーが発生した場合、falseを返すこと', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$valid_hash';

      mockedArgon2.verify.mockRejectedValue(new Error('Verification error'));

      const result = await passwordUtil.verifyPassword(password, hash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(hash, password);
      expect(result).toBe(false);
    });

    it('argon2i形式のハッシュも検証できること', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const argon2iHash = '$argon2i$v=19$m=65536,t=3,p=1$valid_hash';

      mockedArgon2.verify.mockResolvedValue(true);

      const result = await passwordUtil.verifyPassword(password, argon2iHash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(argon2iHash, password);
      expect(result).toBe(true);
    });

    it('argon2d形式のハッシュも検証できること', async () => {
      const password = TEST_CONSTANTS.VALID_PASSWORD;
      const argon2dHash = '$argon2d$v=19$m=65536,t=3,p=1$valid_hash';

      mockedArgon2.verify.mockResolvedValue(true);

      const result = await passwordUtil.verifyPassword(password, argon2dHash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(argon2dHash, password);
      expect(result).toBe(true);
    });

    it('Unicode文字を含むパスワードを検証できること', async () => {
      const unicodePassword = 'パスワード123🔒';
      const hash = '$argon2id$v=19$m=65536,t=3,p=1$unicode_hash';

      mockedArgon2.verify.mockResolvedValue(true);

      const result = await passwordUtil.verifyPassword(unicodePassword, hash);

      expect(mockedArgon2.verify).toHaveBeenCalledWith(hash, unicodePassword);
      expect(result).toBe(true);
    });
  });
});
