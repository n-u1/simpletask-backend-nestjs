import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';

import { Tag } from './entities/tag.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

/**
 * タグ機能モジュール
 * タグ管理に関連する全ての機能を提供
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tag, TaskTag, User])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService, TypeOrmModule],
})
export class TagsModule {}
