import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '@/users/entities/user.entity';
import { AuthErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

/**
 * JWTペイロード
 */
export interface JwtPayload {
  /** ユーザーID */
  sub: string;
  /** トークンタイプ */
  type: 'access' | 'refresh';
  /** JWT ID（トークン無効化用） */
  jti: string;
  /** 発行時刻 */
  iat: number;
  /** 有効期限 */
  exp: number;
}

/**
 * JWT認証戦略
 * アクセストークンの検証とユーザー情報の取得を行う
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      algorithms: [configService.getOrThrow<string>('jwt.algorithm') as 'HS256'],
    };
    super(options);
  }

  /**
   * JWTペイロードからユーザー情報を取得
   * Passport.jsによって自動的に呼び出される
   */
  async validate(payload: JwtPayload): Promise<User> {
    try {
      // ペイロードの基本検証
      if (!payload.sub || !payload.type || !payload.jti) {
        this.logger.warn('Invalid JWT payload structure', {
          hasSubject: !!payload.sub,
          hasType: !!payload.type,
          hasJti: !!payload.jti,
        });
        throw new BusinessLogicException('無効なトークン形式です', 'INVALID_TOKEN_FORMAT', {}, 'JwtStrategy.validate');
      }

      // アクセストークンかチェック
      if (payload.type !== 'access') {
        this.logger.warn('Invalid token type', {
          tokenType: payload.type,
          jti: payload.jti,
        });
        throw new BusinessLogicException(
          AuthErrorMessages.TOKEN_INVALID,
          'TOKEN_INVALID',
          { expectedType: 'access', actualType: payload.type },
          'JwtStrategy.validate',
        );
      }

      // ユーザー取得
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        this.logger.warn('User not found or inactive', {
          userId: payload.sub,
          jti: payload.jti,
        });
        throw ResourceNotFoundException.user(payload.sub, 'JwtStrategy.validate');
      }

      // 非アクティブユーザーチェック
      if (!user.isActive) {
        this.logger.warn('Inactive user attempted access', {
          userId: user.id,
          jti: payload.jti,
        });
        throw new BusinessLogicException(
          AuthErrorMessages.ACCOUNT_INACTIVE,
          'ACCOUNT_INACTIVE',
          { userId: user.id },
          'JwtStrategy.validate',
        );
      }

      this.logger.log('JWT validation successful', {
        userId: user.id,
        jti: payload.jti,
      });

      return user;
    } catch (error) {
      // ログに記録（デバッグ用）
      this.logger.error('JWT validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jti: payload?.jti ?? 'unknown',
        userId: payload?.sub ?? 'unknown',
      });

      // エラーを再スロー
      throw error;
    }
  }
}
