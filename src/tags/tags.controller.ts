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
import { TagSuccessMessages } from '@common/constants/success-messages.constants';
import {
  ApiCreatedResponse,
  ApiDeleteResponse,
  ApiGetListResponse,
  ApiGetResponse,
  ApiPutResponse,
  ApiSuccessResponse,
} from '@common/decorators/api-response.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BaseResponseDto, CreatedResponseDto, DeletedResponseDto } from '@common/dto/base-response.dto';
import { OwnershipGuard, RequireOwnership } from '@common/guards/ownership.guard';
import { UuidValidationPipe } from '@common/pipes/validation.pipe';

import { CreateTagDto } from './dto/create-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { TagListItemDto, TagResponseDto } from './dto/tag-response.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

/**
 * タグ管理コントローラー
 * タグのCRUD操作、検索、統計情報のAPIエンドポイントを提供
 */
@ApiTags('Tags')
@ApiBearerAuth('JWT-auth')
@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * タグ作成
   */
  @Post()
  @ApiOperation({
    summary: 'タグ作成',
    description: '新しいタグを作成します。タグ名の重複はチェックされます。',
  })
  @ApiCreatedResponse(TagResponseDto, TagSuccessMessages.TAG_CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1分間に10回まで
  async create(
    @CurrentUser('id') userId: string,
    @Body() createTagDto: CreateTagDto,
  ): Promise<CreatedResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.create(userId, createTagDto);

    return CreatedResponseDto.create(tag, TagSuccessMessages.TAG_CREATED, `/api/v1/tags/${tag.id}`);
  }

  /**
   * タグ一覧取得（ページネーション、検索、フィルタリング対応）
   */
  @Get()
  @ApiOperation({
    summary: 'タグ一覧取得',
    description: 'ユーザーのタグ一覧をページネーション、検索、フィルタリング機能付きで取得します。',
  })
  @ApiGetListResponse(TagListItemDto, 'タグ一覧', true)
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: TagQueryDto,
  ): Promise<
    BaseResponseDto<{
      tags: TagListItemDto[];
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
    const result = await this.tagsService.findMany(userId, query);

    return BaseResponseDto.create(
      {
        tags: result.tags,
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
      `${result.tags.length}件のタグを取得しました`,
    );
  }

  /**
   * アクティブなタグ一覧取得（簡易版）
   */
  @Get('active')
  @ApiOperation({
    summary: 'アクティブなタグ一覧取得',
    description: 'ユーザーのアクティブなタグをすべて取得します（タスク作成時などで使用）。',
  })
  @ApiSuccessResponse(TagListItemDto, 'アクティブなタグ一覧を取得しました')
  async findAllActive(@CurrentUser('id') userId: string): Promise<BaseResponseDto<TagListItemDto[]>> {
    const tags = await this.tagsService.findAllActive(userId);

    return BaseResponseDto.create(tags, `${tags.length}件のアクティブなタグを取得しました`);
  }

  /**
   * タグ詳細取得
   */
  @Get(':id')
  @ApiOperation({
    summary: 'タグ詳細取得',
    description: '指定されたIDのタグ詳細情報を取得します。',
  })
  @ApiParam({
    name: 'id',
    description: 'タグID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiGetResponse(TagResponseDto, 'タグ')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'tag', paramName: 'id' })
  async findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.findOne(id, userId);

    return BaseResponseDto.create(tag, TagSuccessMessages.TAG_DETAIL_RETRIEVED);
  }

  /**
   * タグ更新
   */
  @Put(':id')
  @ApiOperation({
    summary: 'タグ更新',
    description: 'タグの情報を更新します。タグ名の重複もチェックされます。',
  })
  @ApiParam({
    name: 'id',
    description: 'タグID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiPutResponse(TagResponseDto, 'タグ')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'tag', paramName: 'id' })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 1分間に20回まで
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.update(id, userId, updateTagDto);

    return BaseResponseDto.create(tag, TagSuccessMessages.TAG_UPDATED);
  }

  /**
   * タグ削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'タグ削除',
    description: 'タグを削除します。使用中のタグは削除できません。',
  })
  @ApiParam({
    name: 'id',
    description: 'タグID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiDeleteResponse('タグ')
  @UseGuards(OwnershipGuard)
  @RequireOwnership({ resourceType: 'tag', paramName: 'id' })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1分間に10回まで
  async remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DeletedResponseDto> {
    const result = await this.tagsService.remove(id, userId);

    return DeletedResponseDto.create(result.deletedId, result.message);
  }
}
