import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tag } from '@/tags/entities/tag.entity';
import { TaskTag } from '@/task-tags/entities/task-tag.entity';
import { User } from '@/users/entities/user.entity';

import { Task } from './entities/task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

/**
 * タスク機能モジュール
 */
@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskTag, Tag, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule],
})
export class TasksModule {}
