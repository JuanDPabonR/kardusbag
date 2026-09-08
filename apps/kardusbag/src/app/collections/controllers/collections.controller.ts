import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { PaginationDto, ResponseMessage } from '@kardusbag/shared';
import { CollectionsService } from '@kardusbag/collections';
import { COLLECTION_REPOSITORY_PORT } from '@kardusbag/collections';
import { Inject } from '@nestjs/common';

@Controller('collections')
export class CollectionsController {
  constructor(
    @Inject(COLLECTION_REPOSITORY_PORT)
    private readonly collectionsAdminService: CollectionsService,
  ) {}

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

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.collectionsAdminService.findBySlug(slug);
    return result.toPrimitives();
  }
}
