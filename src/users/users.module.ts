import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { Task } from '@/tasks/entities/task.entity';
import { PasswordUtil } from '@common/utils/password.util';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * ユーザーモジュール
 * ユーザー管理機能の全コンポーネントを統合
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Task, Tag])],
  controllers: [UsersController],
  providers: [UsersService, PasswordUtil],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
