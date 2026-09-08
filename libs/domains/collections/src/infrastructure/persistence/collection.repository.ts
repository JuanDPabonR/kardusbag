import { Injectable, Inject } from '@nestjs/common';
import {
  CollectionRepositoryPort,
  CollectionWithBags,
} from '../../domain/ports/collection-repository.port';
import {
  type DrizzleDb,
  bagsTable,
  bagsToCollectionsTable,
  collectionsTable,
} from '@kardusbag/database';
import { Collection } from '../../domain/entities/collection';
import { CollectionMapper } from './collection.mapper';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

@Injectable()
export class CollectionRepository implements CollectionRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDb,
  ) {}

  async save(
    collection: Collection,
    bagIds: string[] = [],
  ): Promise<Collection> {
    const raw = CollectionMapper.toPersistenceInsert(collection);
    const [newRow] = await this.db
      .insert(collectionsTable)
      .values(raw)
      .returning();

    if (bagIds.length > 0) {
      // Filtrar solo los bolsos que realmente existen y están activos
      const validBags = await this.db
        .select({ id: bagsTable.id })
        .from(bagsTable)
        .where(and(inArray(bagsTable.id, bagIds), isNull(bagsTable.deletedAt)));

      if (validBags.length > 0) {
        await this.db.insert(bagsToCollectionsTable).values(
          validBags.map((b) => ({
            collectionId: newRow.id,
            bagId: b.id,
          })),
        );
      }
    }
    return CollectionMapper.toDomain(newRow);
  }

  async update(collection: Collection): Promise<Collection> {
    const raw = CollectionMapper.toPersistenceUpdate(collection);
    const [newRow] = await this.db
      .update(collectionsTable)
      .set(raw)
      .where(eq(collectionsTable.id, collection.toPrimitives().id))
      .returning();
    return CollectionMapper.toDomain(newRow);
  }

  async findById(id: string): Promise<Collection | null> {
    const raw = await this.db.query.collectionsTable.findFirst({
      where: and(
        eq(collectionsTable.id, id),
        isNull(collectionsTable.deletedAt),
      ),
    });
    if (!raw) return null;
    return CollectionMapper.toDomain(raw);
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    const raw = await this.db.query.collectionsTable.findFirst({
      where: and(
        eq(collectionsTable.slug, slug),
        isNull(collectionsTable.deletedAt),
      ),
    });
    if (!raw) return null;
    return CollectionMapper.toDomain(raw);
  }

  async findByIdWithBags(id: string): Promise<CollectionWithBags | null> {
    const raw = await this.db.query.collectionsTable.findFirst({
      where: and(
        eq(collectionsTable.id, id),
        isNull(collectionsTable.deletedAt),
      ),
      with: {
        bags: {
          with: {
            bag: true, // Trae los datos de cada bolso desde bagsTable
          },
        },
      },
    });
    if (!raw) return null;
    const validBags = raw.bags
      .map((rel) => rel.bag)
      .filter((bag) => !bag.deletedAt);
    return {
      collection: CollectionMapper.toDomain(raw),
      totalBags: validBags.length,
      bags: validBags,
    };
  }

  async findAll(): Promise<CollectionWithBags[]> {
    const raw = await this.db.query.collectionsTable.findMany({
      where: isNull(collectionsTable.deletedAt),
      with: {
        bags: {
          with: {
            bag: true,
          },
        },
      },
    });

    return raw.map((c) => {
      const validBags = c.bags
        .map((rel) => rel.bag)
        .filter((b) => !b.deletedAt);

      return {
        collection: CollectionMapper.toDomain(c),
        totalBags: validBags.length,
        bags: validBags,
      };
    });
  }

  async addBags(collectionId: string, bagIds: string[]): Promise<Collection> {
    return this.db.transaction(async (tx) => {
      for (const bagId of bagIds) {
        await tx.insert(bagsToCollectionsTable).values({
          collectionId,
          bagId,
        });
      }
      return this.findById(collectionId);
    });
  }

  async removeBags(
    collectionId: string,
    bagIds: string[],
  ): Promise<Collection> {
    return this.db.transaction(async (tx) => {
      for (const bagId of bagIds) {
        await tx
          .delete(bagsToCollectionsTable)
          .where(
            and(
              eq(bagsToCollectionsTable.collectionId, collectionId),
              eq(bagsToCollectionsTable.bagId, bagId),
            ),
          );
      }
      return this.findById(collectionId);
    });
  }
}
