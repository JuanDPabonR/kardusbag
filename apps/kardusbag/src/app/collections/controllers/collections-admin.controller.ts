// apps/kardusbag/src/collections/infrastructure/controllers/collections-admin.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto, ResponseMessage } from '@kardusbag/shared';
import { CollectionsAdminService } from '@kardusbag/collections';
import {
  CreateCollectionDto,
  ManageCollectionBagsDto,
} from '../dtos/collection.dto';
import {
  CollectionSlugAlreadyExistsException,
  CollectionNotFoundException,
  CollectionInvalidDatesException,
} from '@kardusbag/collections';
import {
  COLLECTION_REPOSITORY_PORT,
  CollectionRepositoryPort,
} from '@kardusbag/collections';
import { Inject } from '@nestjs/common';

@Controller('admin/collections')
export class CollectionsAdminController {
  constructor(
    private readonly collectionsAdminService: CollectionsAdminService,
    @Inject(COLLECTION_REPOSITORY_PORT)
    private readonly repository: CollectionRepositoryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCollectionDto) {
    const collection = await this.collectionsAdminService.create(dto);
    return collection.toPrimitives();
  }

  @Get()
  @ResponseMessage('Colecciones obtenidas exitosamente')
  async findAll(@Query() query: PaginationDto) {
    const paginated = await this.collectionsAdminService.findAll(query);
    return paginated.map(({ collection, totalBags, bags }) => {
      const data = collection.toPrimitives();
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        bannerUrl: data.bannerUrl,
        isActive: data.isActive,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        totalBags,
        bags,
      };
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const { collection, totalBags, bags } =
      await this.collectionsAdminService.findByIdWithBags(id);
    const data = collection.toPrimitives();
    return {
      ...data,
      totalBags,
      bags,
    };
  }

  @Post(':id/bags')
  @HttpCode(HttpStatus.OK)
  async addBags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageCollectionBagsDto,
  ) {
    return await this.collectionsAdminService.addBags(id, dto.bagIds);
  }

  @Delete(':id/bags')
  @HttpCode(HttpStatus.OK)
  async removeBags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageCollectionBagsDto,
  ) {
    await this.repository.removeBags(id, dto.bagIds);
    return { message: 'Bolsos removidos exitosamente.' };
  }
}
