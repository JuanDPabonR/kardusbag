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
  Put,
} from '@nestjs/common';
import { PaginationDto, ResponseMessage } from '@kardusbag/shared';
import { CollectionsAdminService } from '@kardusbag/collections';
import {
  CreateCollectionDto,
  ManageCollectionBagsDto,
} from '../dtos/collection.dto';
import {
  COLLECTION_REPOSITORY_PORT,
  CollectionRepositoryPort,
} from '@kardusbag/collections';
import { Inject } from '@nestjs/common';

@Controller('admin/collections')
export class CollectionsAdminController {
  constructor(
    @Inject(COLLECTION_REPOSITORY_PORT)
    private readonly collectionsAdminService: CollectionsAdminService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCollectionDto) {
    const collection = await this.collectionsAdminService.create(dto);
    return collection.toPrimitives();
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
    await this.collectionsAdminService.removeBags(id, dto.bagIds);
    return { message: 'Bolsos removidos exitosamente.' };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Colección actualizada exitosamente')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCollectionDto,
  ) {
    const collection = await this.collectionsAdminService.update(id, dto);
    return collection.toPrimitives();
  }
}
