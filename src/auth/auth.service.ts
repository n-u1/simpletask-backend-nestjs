import { randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/users/entities/user.entity';
import { isWeakPassword, validateDisplayName } from '@common/constants/app.constants';
import { GeneralErrorMessages, ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';
import { PasswordUtil } from '@common/utils/password.util';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUserDto, TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * 認証サービス
 * ユーザー認証、JWT トークン管理を担当
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  /**
   * ユーザー登録
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, displayName, avatarUrl } = registerDto;

    // メールアドレス重複チェック
    const existingUser = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email'],
    });

    if (existingUser) {
      throw BusinessLogicException.emailAlreadyExists(email, 'AuthService.register');
    }

    // 表示名バリデーション
    if (!validateDisplayName(displayName)) {
      throw new BusinessLogicException(
        ValidationErrorMessages.DISPLAY_NAME_INVALID,
        'DISPLAY_NAME_INVALID',
        { displayName },
        'AuthService.register',
      );
    }

    // 弱いパスワードチェック
    if (isWeakPassword(password)) {
      throw BusinessLogicException.weakPassword('AuthService.register');
    }

    try {
      // パスワードハッシュ化
      const hashedPassword = await this.passwordUtil.hashPassword(password);

      // ユーザー作成
      const user = this.userRepository.create({
        email,
        passwordHash: hashedPassword,
        displayName,
        avatarUrl: avatarUrl ?? null,
        isActive: true,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.log('User registered successfully', {
        userId: savedUser.id,
        email: `${email.slice(0, 3)}***`,
      });

      return savedUser;
    } catch (error) {
      this.logger.error('User registration failed', {
        email: `${email.slice(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof BusinessLogicException) {
        throw error;
      }

      throw new BusinessLogicException(
        GeneralErrorMessages.USER_REGISTRATION_FAILED,
        'USER_REGISTRATION_FAILED',
        {},
        'AuthService.register',
      );
    }
  }

  /**
   * ユーザー認証（ログイン）
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    try {
      // ユーザー取得
      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
        select: ['id', 'email', 'passwordHash', 'displayName', 'avatarUrl', 'isActive'],
      });

      if (!user) {
        throw BusinessLogicException.invalidCredentials(email, 'AuthService.login');
      }

      // パスワード検証
      const isPasswordValid = await this.passwordUtil.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        this.logger.warn('Invalid password attempt', {
          userId: user.id,
          email: `${email.slice(0, 3)}***`,
        });
        throw BusinessLogicException.invalidCredentials(email, 'AuthService.login');
      }

      // JWT トークン生成
      const tokens = await this.generateTokens(user.id);

      this.logger.log('User login successful', {
        userId: user.id,
        email: `${email.slice(0, 3)}***`,
      });

      // レスポンス作成
      const authUser = new AuthUserDto({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      });

      return new TokenResponseDto({
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.getOrThrow<number>('jwt.accessTokenExpire') * 60,
        refreshToken: tokens.refreshToken,
        user: authUser,
      });
    } catch (error) {
      if (error instanceof BusinessLogicException) {
        throw error;
      }

      this.logger.error('Login failed', {
        email: `${email.slice(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(GeneralErrorMessages.LOGIN_FAILED, 'LOGIN_FAILED', {}, 'AuthService.login');
    }
  }

  /**
   * リフレッシュトークンでアクセストークンを更新
   */
  async refreshToken(user: User): Promise<TokenResponseDto> {
    try {
      // ユーザーの最新情報を取得
      const currentUser = await this.userRepository.findOne({
        where: { id: user.id, isActive: true },
        select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive'],
      });

      if (!currentUser) {
        throw ResourceNotFoundException.user(user.id, 'AuthService.refreshToken');
      }

      // 新しいトークン生成
      const tokens = await this.generateTokens(currentUser.id);

      this.logger.log('Token refresh successful', {
        userId: currentUser.id,
      });

      // レスポンス作成
      const authUser = new AuthUserDto({
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl ?? null,
      });

      return new TokenResponseDto({
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.getOrThrow<number>('jwt.accessTokenExpire') * 60,
        refreshToken: tokens.refreshToken,
        user: authUser,
      });
    } catch (error) {
      if (error instanceof BusinessLogicException || error instanceof ResourceNotFoundException) {
        throw error;
      }

      this.logger.error('Token refresh failed', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        GeneralErrorMessages.TOKEN_REFRESH_FAILED,
        'TOKEN_REFRESH_FAILED',
        {},
        'AuthService.refreshToken',
      );
    }
  }

  /**
   * ユーザー認証（内部用）
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
        select: ['id', 'email', 'passwordHash', 'displayName', 'avatarUrl', 'isActive'],
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await this.passwordUtil.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return null;
      }

      // パスワードハッシュを除いて返す
      const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      this.logger.error('User validation failed', {
        email: `${email.slice(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return null;
    }
  }

  /**
   * JWT トークンペアを生成
   */
  private async generateTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const jti = randomUUID();

    // アクセストークン生成
    const accessTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      type: 'access',
      jti,
    };

    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      expiresIn: `${this.configService.getOrThrow<number>('jwt.accessTokenExpire')}m`,
    });

    // リフレッシュトークン生成
    const refreshTokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      type: 'refresh',
      jti: randomUUID(), // リフレッシュトークンは別のJTI
    };

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: `${this.configService.getOrThrow<number>('jwt.refreshTokenExpire')}d`,
    });

    return { accessToken, refreshToken };
  }

  /**
   * ユーザーIDでユーザー情報を取得
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'email', 'displayName', 'avatarUrl', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw ResourceNotFoundException.user(userId, 'AuthService.getUserById');
    }

    return user;
  }
}
