import { Collection } from '../entities/collection';

export const COLLECTION_REPOSITORY_PORT = Symbol('COLLECTION_REPOSITORY_PORT');

export interface CollectionWithBags {
  collection: Collection;
  totalBags: number;
  bags: Array<{
    id: string;
    name: string;
  }>;
}

export interface CollectionRepositoryPort {
  save(collection: Collection, bagIds?: string[]): Promise<Collection>;
  update(collection: Collection): Promise<Collection>;
  findById(id: string): Promise<Collection | null>;
  findByIdWithBags(id: string): Promise<CollectionWithBags | null>;
  findBySlug(slug: string): Promise<Collection | null>;
  findAll(): Promise<CollectionWithBags[]>;
  addBags(collectionId: string, bagIds: string[]): Promise<Collection>;
  removeBags(collectionId: string, bagIds: string[]): Promise<Collection>;
}
