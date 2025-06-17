import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

import { BusinessLogicException } from '@common/exceptions/business-logic.exception';

/**
 * パスワード関連のユーティリティクラス
 * Argon2を使用したパスワードハッシュ化と検証
 */
@Injectable()
export class PasswordUtil {
  private readonly logger = new Logger(PasswordUtil.name);

  // Argon2設定（環境変数から取得）
  private readonly argon2Config: argon2.Options;

  constructor(private readonly configService: ConfigService) {
    this.argon2Config = {
      type: argon2.argon2id,
      timeCost: this.configService.getOrThrow<number>('argon2.timeCost'),
      memoryCost: this.configService.getOrThrow<number>('argon2.memoryCost'),
      parallelism: this.configService.getOrThrow<number>('argon2.parallelism'),
      hashLength: this.configService.getOrThrow<number>('argon2.hashLength'),
    };

    // 設定値の妥当性をチェック
    this.validateArgon2Config();
  }

  /**
   * パスワードをハッシュ化
   * @param password プレーンテキストパスワード
   * @returns Argon2ハッシュ文字列
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await argon2.hash(password, this.argon2Config);
      return hash;
    } catch (error) {
      this.logger.error('Password hashing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        'パスワードの処理に失敗しました',
        'PASSWORD_HASH_FAILED',
        {},
        'PasswordUtil.hashPassword',
      );
    }
  }

  /**
   * パスワードを検証
   * @param password プレーンテキストパスワード
   * @param hash 保存されているハッシュ
   * @returns 検証結果
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // 入力値の基本チェック
      if (!password || !hash) {
        return false;
      }

      // ハッシュ形式の基本チェック
      if (!this.isValidArgon2Hash(hash)) {
        this.logger.warn('Invalid hash format detected');
        return false;
      }

      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error('Password verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // セキュリティ: 検証エラーは常にfalseを返す
      return false;
    }
  }

  /**
   * Argon2ハッシュの有効性をチェック
   */
  private isValidArgon2Hash(hash: string): boolean {
    return /^\$argon2[id]{0,2}\$/.test(hash);
  }

  /**
   * Argon2設定の妥当性をチェック
   */
  private validateArgon2Config(): void {
    const errors: string[] = [];

    if (this.argon2Config.timeCost! < 1 || this.argon2Config.timeCost! > 100) {
      errors.push('timeCost must be between 1 and 100');
    }

    if (this.argon2Config.memoryCost! < 1024 || this.argon2Config.memoryCost! > 2 ** 24) {
      errors.push('memoryCost must be between 1024 and 16777216');
    }

    if (this.argon2Config.parallelism! < 1 || this.argon2Config.parallelism! > 255) {
      errors.push('parallelism must be between 1 and 255');
    }

    if (this.argon2Config.hashLength! < 16 || this.argon2Config.hashLength! > 512) {
      errors.push('hashLength must be between 16 and 512');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid Argon2 configuration: ${errors.join(', ')}`);
    }

    this.logger.log('Argon2 configuration validated successfully');
  }
}
