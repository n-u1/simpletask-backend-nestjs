import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  // セキュリティ設定
  app.use(helmet());

  // CORS設定
  app.enableCors({
    origin: configService.getOrThrow<string>('security.corsOrigins'),
    credentials: true,
  });

  // バリデーションパイプ
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // APIプレフィックス
  app.setGlobalPrefix(configService.getOrThrow<string>('app.apiPrefix'));

  // Swagger設定
  const config = new DocumentBuilder()
    .setTitle(configService.getOrThrow<string>('app.name'))
    .setDescription('SimpleTask API Documentation')
    .setVersion(configService.getOrThrow<string>('app.version'))
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
