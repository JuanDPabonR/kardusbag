import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { collectionsTable } from '@kardusbag/database';
import { Collection } from '../../domain/entities/collection';

export type CollectionDbRecord = InferSelectModel<typeof collectionsTable>;
export type CollectionDbInsert = InferInsertModel<typeof collectionsTable>;

export class CollectionMapper {
  /**
   * Convierte un registro de la base de datos a la entidad de dominio Collection
   */
  public static toDomain(record: CollectionDbRecord): Collection {
    return Collection.reconstitute({
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description,
      bannerUrl: record.bannerUrl,
      isActive: record.isActive,
      startsAt: record.startsAt ? new Date(record.startsAt) : null,
      endsAt: record.endsAt ? new Date(record.endsAt) : null,
      createdAt: new Date(record.createdAt),
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
    });
  }

  /**
   * Convierte la entidad Collection a objeto de inserción para Drizzle
   */
  public static toPersistenceInsert(domain: Collection): CollectionDbInsert {
    const props = domain.toPrimitives();

    return {
      id: props.id,
      name: props.name,
      slug: props.slug,
      description: props.description ?? null,
      bannerUrl: props.bannerUrl ?? null,
      isActive: props.isActive ?? true,
      startsAt: props.startsAt ?? null,
      endsAt: props.endsAt ?? null,
      createdAt: props.createdAt ?? new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }

  /**
   * Convierte la entidad Collection a objeto de actualización para Drizzle
   */
  public static toPersistenceUpdate(
    domain: Collection,
  ): Partial<CollectionDbInsert> {
    const props = domain.toPrimitives();

    return {
      name: props.name,
      slug: props.slug,
      description: props.description ?? null,
      bannerUrl: props.bannerUrl ?? null,
      isActive: props.isActive ?? true,
      startsAt: props.startsAt ?? null,
      endsAt: props.endsAt ?? null,
      deletedAt: props.deletedAt ?? null,
    };
  }

  /**
   * Alias genérico de inserción
   */
  public static toPersistence(domain: Collection): CollectionDbInsert {
    return this.toPersistenceInsert(domain);
  }
}
