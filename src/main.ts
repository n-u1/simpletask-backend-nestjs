import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 基本設定
  const port = configService.getOrThrow<number>('app.port');
  const environment = configService.getOrThrow<string>('app.environment');
  const apiPrefix = configService.getOrThrow<string>('app.apiPrefix');

  // API プレフィックス設定
  app.setGlobalPrefix(apiPrefix);

  // セキュリティ設定
  app.use(
    helmet({
      contentSecurityPolicy: environment === 'production',
      crossOriginEmbedderPolicy: environment === 'production',
    }),
  );

  // CORS設定
  const corsOrigins = configService.getOrThrow<string>('security.corsOrigins').split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // グローバルバリデーションパイプ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );

  // Swagger設定（開発環境のみ）
  if (environment === 'development') {
    const config = new DocumentBuilder()
      .setTitle('SimpleTask API')
      .setDescription('Personal task management application API')
      .setVersion(configService.get('app.version', '0.1.0'))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management and profiles')
      .addTag('Tasks', 'Task management operations')
      .addTag('Tags', 'Tag management for task organization')
      .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        tryItOutEnabled: true,
      },
    });

    logger.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
  }

  // グレースフルシャットダウン設定
  app.enableShutdownHooks();

  // アプリケーション起動
  await app.listen(port);

  // 起動ログ
  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔧 Configuration loaded successfully`);

  // 開発環境での追加情報
  if (environment === 'development') {
    logger.log(`🗄️  Database: ${configService.get('database.host')}:${configService.get('database.port')}`);
    logger.log(`📦 Redis: ${configService.get('redis.host')}:${configService.get('redis.port')}`);
    logger.log(`🔐 JWT Algorithm: ${configService.get('jwt.algorithm')}`);
  }
}

// アプリケーション起動
bootstrap().catch(error => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
});

// プロセス終了時の処理
process.on('SIGTERM', () => {
  const logger = new Logger('Process');
  logger.log('🛑 SIGTERM received, shutting down gracefully');
});

process.on('SIGINT', () => {
  const logger = new Logger('Process');
  logger.log('🛑 SIGINT received, shutting down gracefully');
});

// 未処理の例外・Promise拒否
process.on('uncaughtException', error => {
  const logger = new Logger('Process');
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('Process');
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
