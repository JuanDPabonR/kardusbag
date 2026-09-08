import { Injectable, Inject } from '@nestjs/common';
import {
  Collection,
  type CollectionProps,
} from '../../domain/entities/collection';
import {
  CollectionRepositoryPort,
  COLLECTION_REPOSITORY_PORT,
} from '../../domain/ports/collection-repository.port';
import {
  CollectionSlugAlreadyExistsException,
  CollectionNotFoundException,
} from '../../domain/exceptions/collection.exception';

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
export class CollectionsAdminService {
  constructor(
    @Inject(COLLECTION_REPOSITORY_PORT)
    private readonly repository: CollectionRepositoryPort,
  ) {}

  async create(collection: collection): Promise<Collection> {
    const slug = collection.slug
      ? Collection.generateSlug(collection.slug)
      : Collection.generateSlug(collection.name);

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new CollectionSlugAlreadyExistsException(slug);
    }

    const startsAt = collection.startsAt ? new Date(collection.startsAt) : null;
    const endsAt = collection.endsAt ? new Date(collection.endsAt) : null;

    const newcollection = Collection.create({
      name: collection.name,
      slug,
      description: collection.description,
      bannerUrl: collection.bannerUrl,
      isActive: collection.isActive ?? true,
      startsAt,
      endsAt,
    });

    return await this.repository.save(newcollection, collection.bagIds);
  }

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

  async findAll() {
    return await this.repository.findAll();
  }

  async update(id: string, dto: collection): Promise<Collection> {
    const collection = await this.findById(id);

    collection.updateDetails({
      name: dto.name,
      slug: dto.slug ? Collection.generateSlug(dto.slug) : undefined,
      description: dto.description,
      bannerUrl: dto.bannerUrl,
      isActive: dto.isActive,
      startsAt:
        dto.startsAt !== undefined
          ? dto.startsAt
            ? new Date(dto.startsAt)
            : null
          : undefined,
      endsAt:
        dto.endsAt !== undefined
          ? dto.endsAt
            ? new Date(dto.endsAt)
            : null
          : undefined,
    });

    return await this.repository.update(collection);
  }

  async addBags(collectionId: string, bagIds: string[]): Promise<Collection> {
    await this.findById(collectionId);
    return await this.repository.addBags(collectionId, bagIds);
  }

  async removeBags(
    collectionId: string,
    bagIds: string[],
  ): Promise<Collection> {
    await this.findById(collectionId);
    return await this.repository.removeBags(collectionId, bagIds);
  }
}
