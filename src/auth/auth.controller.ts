import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { User } from '@/users/entities/user.entity';
import {
  AuthErrorMessages,
  GeneralErrorMessages,
  ResourceErrorMessages,
} from '@common/constants/error-messages.constants';
import { AuthSuccessMessages } from '@common/constants/success-messages.constants';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiSuccessResponse,
  ApiUnauthorizedResponse,
} from '@common/decorators/api-response.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BaseResponseDto } from '@common/dto/base-response.dto';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto, TokenResponseDto } from './dto/token-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';

/**
 * 認証コントローラー
 * ユーザー認証関連のエンドポイントを提供
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ユーザー登録
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'ユーザー登録',
    description: '新規ユーザーアカウントを作成します',
  })
  @ApiCreatedResponse(User, AuthSuccessMessages.USER_CREATED)
  @ApiBadRequestResponse(GeneralErrorMessages.VALIDATION_ERROR)
  @ApiConflictResponse(AuthErrorMessages.EMAIL_ALREADY_EXISTS)
  async register(@Body() registerDto: RegisterDto): Promise<BaseResponseDto<User>> {
    const user = await this.authService.register(registerDto);
    return BaseResponseDto.create(user, AuthSuccessMessages.USER_CREATED);
  }

  /**
   * ユーザーログイン
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ユーザーログイン',
    description: 'メールアドレスとパスワードでログインしてJWTトークンを取得します',
  })
  @ApiSuccessResponse(TokenResponseDto, AuthSuccessMessages.LOGIN_SUCCESS)
  @ApiBadRequestResponse(GeneralErrorMessages.VALIDATION_ERROR)
  @ApiUnauthorizedResponse(AuthErrorMessages.CREDENTIALS_INVALID)
  async login(@Body() loginDto: LoginDto): Promise<BaseResponseDto<TokenResponseDto>> {
    const tokenResponse = await this.authService.login(loginDto);
    return BaseResponseDto.create(tokenResponse, AuthSuccessMessages.LOGIN_SUCCESS);
  }

  /**
   * トークン更新
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtGuard)
  @ApiOperation({
    summary: 'トークン更新',
    description: 'リフレッシュトークンを使用してアクセストークンを更新します',
  })
  @ApiSuccessResponse(TokenResponseDto, AuthSuccessMessages.TOKEN_REFRESHED)
  @ApiBadRequestResponse(GeneralErrorMessages.VALIDATION_ERROR)
  @ApiUnauthorizedResponse(AuthErrorMessages.REFRESH_TOKEN_INVALID)
  @ApiNotFoundResponse(ResourceErrorMessages.USER_NOT_FOUND)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUser() user: User,
  ): Promise<BaseResponseDto<TokenResponseDto>> {
    const tokenResponse = await this.authService.refreshToken(user);
    return BaseResponseDto.create(tokenResponse, AuthSuccessMessages.TOKEN_REFRESHED);
  }

  /**
   * 現在のユーザー情報取得
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '現在のユーザー情報取得',
    description: 'アクセストークンから現在のユーザー情報を取得します',
  })
  @ApiSuccessResponse(User, AuthSuccessMessages.USER_INFO_RETRIEVED)
  @ApiUnauthorizedResponse(AuthErrorMessages.UNAUTHORIZED)
  getCurrentUser(@CurrentUser() user: User): BaseResponseDto<User> {
    return BaseResponseDto.create(user, AuthSuccessMessages.USER_INFO_RETRIEVED);
  }

  /**
   * ログアウト
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'ログアウト',
    description: 'ユーザーをログアウトします',
  })
  @ApiSuccessResponse(Object, AuthSuccessMessages.LOGOUT_SUCCESS)
  @ApiUnauthorizedResponse(AuthErrorMessages.UNAUTHORIZED)
  logout(): BaseResponseDto<{ message: string }> {
    // 現在はクライアント側でトークンを削除するだけ
    // TODO: Redisでトークンブラックリスト機能を実装予定
    return BaseResponseDto.create(
      { message: 'ログアウトしました。クライアント側でトークンを削除してください。' },
      AuthSuccessMessages.LOGOUT_SUCCESS,
    );
  }
}
