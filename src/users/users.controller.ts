import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/users/entities/user.entity';
import { AuthSuccessMessages } from '@common/constants/success-messages.constants';
import {
  ApiBadRequestResponse,
  ApiDeleteResponse,
  ApiGetResponse,
  ApiPutResponse,
  ApiUnauthorizedResponse,
} from '@common/decorators/api-response.decorator';
import { CurrentUser, UserId } from '@common/decorators/current-user.decorator';
import { BaseResponseDto } from '@common/dto/base-response.dto';

import { ChangeEmailDto, ChangePasswordDto, DeactivateAccountDto, UpdateUserProfileDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

/**
 * ユーザーコントローラー
 * ユーザー管理関連のエンドポイントを提供
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * プロフィール取得
   */
  @Get('me/profile')
  @ApiOperation({
    summary: 'プロフィール取得',
    description: '現在ログイン中のユーザーの詳細プロフィールを取得します',
  })
  @ApiGetResponse(UserResponseDto, 'プロフィール')
  @ApiUnauthorizedResponse()
  getMyProfile(@CurrentUser() user: User): BaseResponseDto<UserResponseDto> {
    const response = UserResponseDto.fromEntity(user);

    return BaseResponseDto.create(response, AuthSuccessMessages.PROFILE_RETRIEVED);
  }

  /**
   * プロフィール更新
   */
  @Put('me/profile')
  @ApiOperation({
    summary: 'プロフィール更新',
    description: '現在ログイン中のユーザーのプロフィールを更新します',
  })
  @ApiPutResponse(UserResponseDto, 'プロフィール')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async updateProfile(
    @UserId() userId: string,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);
    const userResponse = UserResponseDto.fromEntity(updatedUser);

    return BaseResponseDto.create(userResponse, AuthSuccessMessages.PROFILE_UPDATED);
  }

  /**
   * パスワード変更
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'パスワード変更',
    description: '現在ログイン中のユーザーのパスワードを変更します',
  })
  @ApiPutResponse(Object, 'パスワード変更')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async changePassword(
    @UserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponseDto<{ message: string }>> {
    await this.usersService.changePassword(userId, changePasswordDto);

    return BaseResponseDto.create(
      { message: AuthSuccessMessages.PASSWORD_CHANGED },
      AuthSuccessMessages.PASSWORD_CHANGED,
    );
  }

  /**
   * メールアドレス変更
   */
  @Put('me/email')
  @ApiOperation({
    summary: 'メールアドレス変更',
    description: '現在ログイン中のユーザーのメールアドレスを変更します',
  })
  @ApiPutResponse(UserResponseDto, 'メールアドレス変更')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async changeEmail(
    @UserId() userId: string,
    @Body() changeEmailDto: ChangeEmailDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const updatedUser = await this.usersService.changeEmail(userId, changeEmailDto);
    const userResponse = UserResponseDto.fromEntity(updatedUser);

    return BaseResponseDto.create(userResponse, AuthSuccessMessages.EMAIL_CHANGED);
  }

  /**
   * アカウント無効化
   */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'アカウント無効化',
    description: '現在ログイン中のユーザーのアカウントを無効化します',
  })
  @ApiDeleteResponse('アカウント無効化')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async deactivateAccount(
    @UserId() userId: string,
    @Body() deactivateDto: DeactivateAccountDto,
  ): Promise<BaseResponseDto<{ message: string }>> {
    await this.usersService.deactivateAccount(userId, deactivateDto);

    return BaseResponseDto.create(
      { message: AuthSuccessMessages.ACCOUNT_DEACTIVATED },
      AuthSuccessMessages.ACCOUNT_DEACTIVATED,
    );
  }
}
