import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { Repository } from 'typeorm';

import { JwtPayload } from '@/auth/strategies/jwt.strategy';
import { User } from '@/users/entities/user.entity';
import { AuthErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';

/**
 * リフレッシュJWT認証戦略
 * リフレッシュトークンの検証とユーザー情報の取得を行う
 */
@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(RefreshJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      algorithms: [configService.getOrThrow<string>('jwt.algorithm') as 'HS256'],
    };
    super(options);
  }

  /**
   * リフレッシュトークンのペイロードからユーザー情報を取得
   */
  async validate(payload: JwtPayload): Promise<User> {
    try {
      // ペイロードの基本検証
      if (!payload.sub || !payload.type || !payload.jti) {
        this.logger.warn('Invalid refresh JWT payload structure', {
          hasSubject: !!payload.sub,
          hasType: !!payload.type,
          hasJti: !!payload.jti,
        });
        throw new BusinessLogicException(
          AuthErrorMessages.REFRESH_TOKEN_INVALID,
          'REFRESH_TOKEN_INVALID,',
          {},
          'RefreshJwtStrategy.validate',
        );
      }

      // リフレッシュトークンかチェック
      if (payload.type !== 'refresh') {
        this.logger.warn('Invalid refresh token type', {
          tokenType: payload.type,
          jti: payload.jti,
        });
        throw new BusinessLogicException(
          AuthErrorMessages.REFRESH_TOKEN_INVALID,
          'REFRESH_TOKEN_INVALID',
          { expectedType: 'refresh', actualType: payload.type },
          'RefreshJwtStrategy.validate',
        );
      }

      // ユーザー取得
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        this.logger.warn('User not found or inactive for refresh token', {
          userId: payload.sub,
          jti: payload.jti,
        });
        throw ResourceNotFoundException.user(payload.sub, 'RefreshJwtStrategy.validate');
      }

      // 非アクティブユーザーチェック
      if (!user.isActive) {
        this.logger.warn('Inactive user attempted refresh', {
          userId: user.id,
          jti: payload.jti,
        });
        throw new BusinessLogicException(
          AuthErrorMessages.ACCOUNT_INACTIVE,
          'ACCOUNT_INACTIVE',
          { userId: user.id },
          'RefreshJwtStrategy.validate',
        );
      }

      this.logger.log('Refresh JWT validation successful', {
        userId: user.id,
        jti: payload.jti,
      });

      return user;
    } catch (error) {
      // ログに記録（デバッグ用）
      this.logger.error('Refresh JWT validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        jti: payload?.jti ?? 'unknown',
        userId: payload?.sub ?? 'unknown',
      });

      // エラーを再スロー
      throw error;
    }
  }
}
