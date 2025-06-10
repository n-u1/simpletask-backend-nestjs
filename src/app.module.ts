import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogLevel } from 'typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { Tag } from './tags/entities/tag.entity';
import { TaskTag } from './task-tags/entities/task-tag.entity';
import { Task } from './tasks/entities/task.entity';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        return validationSchema.parse(config);
      },
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // データベース設定
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const enableDebug = configService.get<boolean>('logging.enableDebug');
        const loggingConfig: LogLevel[] | false = enableDebug ? (['query', 'error', 'warn'] as LogLevel[]) : false;

        const config: TypeOrmModuleOptions = {
          type: 'postgres' as const,
          host: configService.getOrThrow<string>('database.host'),
          port: configService.getOrThrow<number>('database.port'),
          username: configService.getOrThrow<string>('database.username'),
          password: configService.getOrThrow<string>('database.password'),
          database: configService.getOrThrow<string>('database.name'),
          entities: [User, Task, Tag, TaskTag],
          migrationsTableName: 'typeorm_migrations',
          synchronize: false, // マイグレーションを使用
          ssl: configService.get<boolean>('database.ssl') ?? false,
          logging: loggingConfig,
          extra: {
            max: configService.getOrThrow<number>('database.poolSize'),
            connectionTimeoutMillis: 2000,
            idleTimeoutMillis: 30000,
          },
        };

        return config;
      },
      inject: [ConfigService],
    }),

    // レート制限
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: 60000, // 1分
          limit: configService.getOrThrow<number>('security.rateLimitPerMinute'),
        },
      ],
      inject: [ConfigService],
    }),

    // ヘルスチェック
    TerminusModule,

    // 今後追加予定のモジュール
    // UsersModule,
    // TasksModule,
    // TagsModule,
    // AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
