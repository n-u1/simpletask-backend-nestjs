import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BaseResponseDto } from '@common/dto/base-response.dto';

import { AppService } from './app.service';

/**
 * アプリケーションルートコントローラー
 * ヘルスチェックと基本情報を提供
 */
@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * アプリケーション基本情報取得
   */
  @Get()
  @ApiOperation({
    summary: 'アプリケーション情報取得',
    description: 'アプリケーションの基本情報とステータスを取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'アプリケーション情報',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'SimpleTask API v0.1.0 is running!' },
            timestamp: { type: 'string', example: '2025-06-20T10:30:00.000Z' },
            environment: { type: 'string', example: 'development' },
          },
        },
      },
    },
  })
  getHello(): BaseResponseDto<{
    message: string;
    timestamp: string;
    environment: string;
  }> {
    const appInfo = this.appService.getAppInfo();

    return BaseResponseDto.create(
      {
        message: this.appService.getHello(),
        timestamp: new Date().toISOString(),
        environment: appInfo.environment,
      },
      'アプリケーション情報を取得しました',
    );
  }

  /**
   * ヘルスチェック
   */
  @Get('health')
  @ApiOperation({
    summary: 'ヘルスチェック',
    description: 'アプリケーションの動作状態を確認します',
  })
  @ApiResponse({
    status: 200,
    description: 'ヘルスチェック結果',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            uptime: { type: 'number', example: 3600 },
            timestamp: { type: 'string', example: '2025-06-20T10:30:00.000Z' },
          },
        },
      },
    },
  })
  getHealthCheck(): BaseResponseDto<{
    status: string;
    uptime: number;
    timestamp: string;
  }> {
    return BaseResponseDto.create(
      {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      'アプリケーションは正常に動作しています',
    );
  }
}
