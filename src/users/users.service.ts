import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { isWeakPassword, validateDisplayName } from '@common/constants/app.constants';
import { GeneralErrorMessages, ValidationErrorMessages } from '@common/constants/error-messages.constants';
import { BusinessLogicException } from '@common/exceptions/business-logic.exception';
import { ResourceNotFoundException } from '@common/exceptions/resource-not-found.exception';
import { PasswordUtil } from '@common/utils/password.util';

import { ChangeEmailDto, ChangePasswordDto, DeactivateAccountDto, UpdateUserProfileDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/**
 * ユーザーサービス
 * ユーザー情報の管理と操作を担当
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  /**
   * メールアドレスでユーザーを取得（内部用）
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
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

      return user;
    } catch (error) {
      this.logger.error('Failed to find user by email', {
        email: `${email.slice(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return null;
    }
  }

  /**
   * プロフィール情報を更新
   */
  async updateProfile(userId: string, updateDto: UpdateUserProfileDto): Promise<User> {
    // 現在のユーザー情報を取得
    const user = await this.userRepository.findOne({
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

    if (!user) {
      throw ResourceNotFoundException.user(userId, 'UsersService.updateProfile');
    }

    try {
      if (updateDto.displayName !== undefined) {
        if (!validateDisplayName(updateDto.displayName)) {
          throw new BusinessLogicException(
            ValidationErrorMessages.DISPLAY_NAME_INVALID,
            'DISPLAY_NAME_INVALID',
            { displayName: updateDto.displayName },
            'UsersService.updateProfile',
          );
        }
        user.displayName = updateDto.displayName.trim();
      }

      if (updateDto.avatarUrl !== undefined) {
        user.avatarUrl = updateDto.avatarUrl.trim() || null;
      }

      const updatedUser = await this.userRepository.save(user);

      this.logger.log('User profile updated successfully', {
        userId: user.id,
        updatedFields: Object.keys(updateDto),
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof BusinessLogicException) {
        throw error;
      }

      this.logger.error('Failed to update user profile', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        GeneralErrorMessages.PROFILE_UPDATE_FAILED,
        'PROFILE_UPDATE_FAILED',
        {},
        'UsersService.updateProfile',
      );
    }
  }

  /**
   * パスワードを変更
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // パスワード確認
    if (newPassword !== confirmPassword) {
      throw new BusinessLogicException(
        ValidationErrorMessages.PASSWORD_CONFIRMATION_MISMATCH,
        'PASSWORD_CONFIRMATION_MISMATCH',
        {},
        'UsersService.changePassword',
      );
    }

    // 弱いパスワードチェック
    if (isWeakPassword(newPassword)) {
      throw BusinessLogicException.weakPassword('UsersService.changePassword');
    }

    try {
      // ユーザー取得（パスワードハッシュ含む）
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'passwordHash'],
      });

      if (!user) {
        throw ResourceNotFoundException.user(userId, 'UsersService.changePassword');
      }

      // 現在のパスワード確認
      const isCurrentPasswordValid = await this.passwordUtil.verifyPassword(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new BusinessLogicException(
          ValidationErrorMessages.PASSWORD_INVALID,
          'PASSWORD_INVALID',
          {},
          'UsersService.changePassword',
        );
      }

      // 新しいパスワードをハッシュ化
      const newPasswordHash = await this.passwordUtil.hashPassword(newPassword);

      // パスワード更新
      await this.userRepository.update(user.id, {
        passwordHash: newPasswordHash,
      });

      this.logger.log('User password changed successfully', {
        userId: user.id,
      });
    } catch (error) {
      if (error instanceof BusinessLogicException || error instanceof ResourceNotFoundException) {
        throw error;
      }

      this.logger.error('Failed to change password', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        GeneralErrorMessages.PASSWORD_CHANGE_FAILED,
        'PASSWORD_CHANGE_FAILED',
        {},
        'UsersService.changePassword',
      );
    }
  }

  /**
   * メールアドレスを変更
   */
  async changeEmail(userId: string, changeEmailDto: ChangeEmailDto): Promise<User> {
    const { newEmail, currentPassword } = changeEmailDto;

    try {
      // ユーザー取得（パスワードハッシュ含む）
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'passwordHash', 'displayName', 'avatarUrl'],
      });

      if (!user) {
        throw ResourceNotFoundException.user(userId, 'UsersService.changeEmail');
      }

      // パスワード確認
      const isPasswordValid = await this.passwordUtil.verifyPassword(currentPassword, user.passwordHash);

      if (!isPasswordValid) {
        throw new BusinessLogicException(
          ValidationErrorMessages.PASSWORD_INVALID,
          'PASSWORD_INVALID',
          {},
          'UsersService.changeEmail',
        );
      }

      // メールアドレス重複チェック
      const existingUser = await this.userRepository.findOne({
        where: { email: newEmail },
        select: ['id'],
      });

      if (existingUser && existingUser.id !== userId) {
        throw BusinessLogicException.emailAlreadyExists(newEmail, 'UsersService.changeEmail');
      }

      // メールアドレス更新
      user.email = newEmail;
      user.isVerified = false; // 新しいメールアドレスは未認証状態

      const updatedUser = await this.userRepository.save(user);

      this.logger.log('User email changed successfully', {
        userId: user.id,
        oldEmail: `***@${user.email.split('@')[1]}`,
        newEmail: `***@${newEmail.split('@')[1]}`,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof BusinessLogicException || error instanceof ResourceNotFoundException) {
        throw error;
      }

      this.logger.error('Failed to change email', {
        userId,
        newEmail: `***@${newEmail.split('@')[1]}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        GeneralErrorMessages.EMAIL_CHANGE_FAILED,
        'EMAIL_CHANGE_FAILED',
        {},
        'UsersService.changeEmail',
      );
    }
  }

  /**
   * アカウントを無効化
   */
  async deactivateAccount(userId: string, deactivateDto: DeactivateAccountDto): Promise<void> {
    const { currentPassword, reason } = deactivateDto;

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'passwordHash'],
      });

      if (!user) {
        throw ResourceNotFoundException.user(userId, 'UsersService.deactivateAccount');
      }

      const isPasswordValid = await this.passwordUtil.verifyPassword(currentPassword, user.passwordHash);

      if (!isPasswordValid) {
        throw new BusinessLogicException(
          ValidationErrorMessages.PASSWORD_INVALID,
          'PASSWORD_INVALID',
          {},
          'UsersService.deactivateAccount',
        );
      }

      // アカウント無効化
      await this.userRepository.update(userId, {
        isActive: false,
      });

      this.logger.log('User account deactivated', {
        userId,
        reason: reason ?? 'No reason provided',
      });
    } catch (error) {
      if (error instanceof BusinessLogicException || error instanceof ResourceNotFoundException) {
        throw error;
      }

      this.logger.error('Failed to deactivate account', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new BusinessLogicException(
        GeneralErrorMessages.ACCOUNT_DEACTIVATION_FAILED,
        'ACCOUNT_DEACTIVATION_FAILED',
        {},
        'UsersService.deactivateAccount',
      );
    }
  }

  /**
   * ログイン失敗処理
   */
  async handleLoginFailure(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'failedLoginAttempts', 'lockedUntil'],
      });

      if (user) {
        user.recordLoginFailure();
        await this.userRepository.save(user);

        this.logger.warn('Login failure recorded', {
          userId: user.id,
          failureCount: user.failedLoginAttempts,
          isLocked: user.isLocked,
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle login failure', {
        email: `${email.slice(0, 3)}***`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * ログイン成功処理
   */
  async handleLoginSuccess(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'failedLoginAttempts', 'lockedUntil', 'lastLoginAt'],
      });

      if (user) {
        user.recordLoginSuccess();
        await this.userRepository.save(user);

        this.logger.log('Login success recorded', {
          userId: user.id,
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle login success', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
