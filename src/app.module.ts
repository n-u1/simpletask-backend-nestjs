import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { TagsModule } from '@/tags/tags.module';
import { TasksModule } from '@/tasks/tasks.module';
import { UsersModule } from '@/users/users.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { CustomValidationPipe } from '@common/pipes/validation.pipe';
import configuration from '@config/configuration';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 設定管理
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // データベース設定
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('database.host'),
        port: configService.getOrThrow<number>('database.port'),
        username: configService.getOrThrow<string>('database.username'),
        password: configService.getOrThrow<string>('database.password'),
        database: configService.getOrThrow<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('app.environment') === 'development',
        logging: configService.get('logging.enableDebug', false),
        ssl: configService.get('database.ssl', false),
        pool: {
          max: configService.getOrThrow<number>('database.poolSize'),
          min: 1,
        },
        extra: {
          connectionLimit: configService.getOrThrow<number>('database.maxOverflow'),
        },
      }),
      inject: [ConfigService],
    }),

    // レート制限設定
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000, // 1秒
          limit: 10, // 1秒間に10リクエスト
        },
        {
          name: 'medium',
          ttl: 60000, // 1分
          limit: configService.getOrThrow<number>('security.rateLimitPerMinute'),
        },
        {
          name: 'long',
          ttl: 900000, // 15分
          limit: 100, // 15分間に100リクエスト
        },
      ],
      inject: [ConfigService],
    }),

    // 機能モジュール
    AuthModule,
    UsersModule,
    TagsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
