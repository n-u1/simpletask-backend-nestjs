import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TaskSuccessMessages } from '@common/constants/success-messages.constants';
import {
  ApiCreatedResponse,
  ApiDeleteResponse,
  ApiGetListResponse,
  ApiGetResponse,
  ApiPutResponse,
} from '@common/decorators/api-response.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BaseResponseDto, CreatedResponseDto, DeletedResponseDto } from '@common/dto/base-response.dto';
import { OwnershipGuard, RequireOwnership } from '@common/guards/ownership.guard';
import { UuidValidationPipe } from '@common/pipes/validation.pipe';

import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskListItemDto, TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

/**
 * タスク管理コントローラー
 * タスクのCRUD操作、検索、一括操作のAPIエンドポイントを提供
 */
@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * タスク作成
   */
  @Post()
  @ApiOperation({
    summary: 'タスク作成',
    description: '新しいタスクを作成します。タグとの関連付けも同時に行えます。',
  })
  @ApiCreatedResponse(TaskResponseDto, TaskSuccessMessages.TASK_CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1分間に10回まで
  async create(
    @CurrentUser('id') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<CreatedResponseDto<TaskResponseDto>> {
    const task = await this.tasksService.create(userId, createTaskDto);

    return CreatedResponseDto.create(task, TaskSuccessMessages.TASK_CREATED, `/api/v1/tasks/${task.id}`);
  }

  /**
   * タスク一覧取得（ページネーション、検索、フィルタリング対応）
   */
  @Get()
  @ApiOperation({
    summary: 'タスク一覧取得',
    description: 'ユーザーのタスク一覧をページネーション、検索、フィルタリング機能付きで取得します。',
  })
  @ApiGetListResponse(TaskListItemDto, 'タスク一覧', true)
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: TaskQueryDto,
  ): Promise<
    BaseResponseDto<{
      tasks: TaskListItemDto[];
      meta: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        sortBy: string;
        order: string;
      };
    }>
  > {
    const result = await this.tasksService.findMany(userId, query);

    return BaseResponseDto.create(
      {
        tasks: result.tasks,
        meta: {
          page: result.meta.page,
          limit: result.meta.limit,
          totalCount: result.meta.totalCount,
          totalPages: result.meta.totalPages,
          hasPreviousPage: result.meta.hasPreviousPage,
          hasNextPage: result.meta.hasNextPage,
          sortBy: result.meta.sortBy,
          order: result.meta.order,
        },
      },
      `${result.tasks.length}件のタスクを取得しました`,
    );
  }

  /**
   * タスク詳細取得
   */
  @Get(':id')
  @ApiOperation({
    summary: 'タスク詳細取得',
    description: '指定されたIDのタスク詳細情報を取得します。',
  })
  @ApiParam({
    name: 'id',
    description: 'タスクID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiGetResponse(TaskResponseDto, 'タスク')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'task', paramName: 'id' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponseDto<TaskResponseDto>> {
    const task = await this.tasksService.findOne(id, userId);

    return BaseResponseDto.create(task, TaskSuccessMessages.TASK_DETAIL_RETRIEVED);
  }

  /**
   * タスク更新
   */
  @Put(':id')
  @ApiOperation({
    summary: 'タスク更新',
    description: 'タスクの情報を更新します。タグの関連付けも更新できます。',
  })
  @ApiParam({
    name: 'id',
    description: 'タスクID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiPutResponse(TaskResponseDto, 'タスク')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'task', paramName: 'id' })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 1分間に20回まで
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<BaseResponseDto<TaskResponseDto>> {
    const task = await this.tasksService.update(id, userId, updateTaskDto);

    return BaseResponseDto.create(task, TaskSuccessMessages.TASK_UPDATED);
  }

  /**
   * タスク削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'タスク削除',
    description: 'タスクを削除します。関連するタグとの関連付けも削除されます。',
  })
  @ApiParam({
    name: 'id',
    description: 'タスクID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiDeleteResponse('タスク')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'task', paramName: 'id' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1分間に10回まで
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DeletedResponseDto> {
    const result = await this.tasksService.remove(id, userId);

    return DeletedResponseDto.create(result.deletedId, result.message);
  }
}
