import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/users/entities/user.entity';
import { PasswordUtil } from '@common/utils/password.util';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

/**
 * 認証モジュール
 * JWT認証システムの全コンポーネントを統合
 */
@Module({
  imports: [
    // TypeORM設定
    TypeOrmModule.forFeature([User]),

    // Passport設定
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // JWT設定
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          algorithm: configService.getOrThrow<string>('jwt.algorithm') as 'HS256',
          issuer: configService.get<string>('app.name', 'SimpleTask API'),
          audience: configService.get<string>('app.name', 'SimpleTask API'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordUtil, JwtStrategy, RefreshJwtStrategy, JwtAuthGuard, RefreshJwtGuard],
  exports: [AuthService, JwtAuthGuard, RefreshJwtGuard, JwtStrategy, RefreshJwtStrategy, PasswordUtil],
})
export class AuthModule {}
