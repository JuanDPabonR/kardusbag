import { Injectable, Inject } from '@nestjs/common';
import {
  Collection,
  type CollectionProps,
} from '../../domain/entities/collection';
import {
  CollectionRepositoryPort,
  COLLECTION_REPOSITORY_PORT,
} from '../../domain/ports/collection-repository.port';
import { CollectionNotFoundException } from '../../domain/exceptions/collection.exception';
import { PaginatedResult, type PaginationParams } from '@kardusbag/shared';
import type { CollectionWithBags } from '../../domain/ports/collection-repository.port';

export type collection = Omit<
  CollectionProps,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'slug'
  | 'isActive'
  | 'startsAt'
  | 'endsAt'
> & {
  slug?: string;
  isActive?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  bagIds?: string[];
};

@Injectable()
export class CollectionsService {
  constructor(
    @Inject(COLLECTION_REPOSITORY_PORT)
    private readonly repository: CollectionRepositoryPort,
  ) {}

  async findById(id: string): Promise<Collection> {
    const collection = await this.repository.findById(id);
    if (!collection) {
      throw new CollectionNotFoundException(id);
    }
    return collection;
  }

  async findByIdWithBags(id: string) {
    const result = await this.repository.findByIdWithBags(id);
    if (!result) {
      throw new CollectionNotFoundException(id);
    }
    return result;
  }

  async findBySlug(slug: string) {
    const result = await this.repository.findBySlug(slug);
    if (!result) {
      throw new CollectionNotFoundException(slug);
    }
    return result;
  }

  async findAll(
    filter?: PaginationParams,
  ): Promise<PaginatedResult<CollectionWithBags>> {
    return await this.repository.findAll(filter);
  }
}
