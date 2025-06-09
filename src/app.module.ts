import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

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

    // データベース設定(準備できるまでコメントアウト)
    // TypeOrmModule.forRootAsync({
    //   useFactory: configService => ({
    //     type: 'postgres',
    //     host: configService.get('database.host'),
    //     port: configService.get('database.port'),
    //     username: configService.get('database.username'),
    //     password: configService.get('database.password'),
    //     database: configService.get('database.name'),
    //     entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //     synchronize: configService.get('app.environment') === 'development',
    //     logging: configService.get('logging.enableDebug'),
    //   }),
    //   inject: [ConfigService],
    // }),

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
