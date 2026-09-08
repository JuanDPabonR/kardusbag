import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { bagsTable } from '@kardusbag/database'; // o la ruta relativa correspondiente a libs/database/src/schema/bag
import { Bag, BagDimensions } from '../../domain/entities/bag.entity';

export type BagDbRecord = InferSelectModel<typeof bagsTable>;
export type BagDbInsert = InferInsertModel<typeof bagsTable>;

export class BagMapper {
  /**
   * Mapea un registro crudo de la base de datos (Drizzle) a la entidad de dominio Bag
   */
  public static toDomain(record: BagDbRecord): Bag {
    return new Bag({
      id: record.id,
      categoryId: record.categoryId,
      name: record.name,
      slug: record.slug,
      skuPrefix: record.skuPrefix,
      description: record.description,
      shortDescription: record.shortDescription,
      careInstructions: record.careInstructions,
      basePrice: Number(record.basePrice),
      compareAtPrice: record.compareAtPrice
        ? Number(record.compareAtPrice)
        : null,
      taxRate: record.taxRate ? Number(record.taxRate) : undefined,
      currency: record.currency,
      material: record.material,
      liningMaterial: record.liningMaterial,
      hardwareMaterial: record.hardwareMaterial,
      dimensions: record.dimensions as BagDimensions | null,
      capacityLiters: record.capacityLiters
        ? Number(record.capacityLiters)
        : null,
      weightGrams: record.weightGrams,
      hasLaptopSleeve: record.hasLaptopSleeve,
      maxLaptopSizeInches: record.maxLaptopSizeInches
        ? Number(record.maxLaptopSizeInches)
        : null,
      isWaterResistant: record.isWaterResistant,
      isActive: record.isActive,
      isFeatured: record.isFeatured,
      isNewArrival: record.isNewArrival,
      metaTitle: record.metaTitle,
      metaDescription: record.metaDescription,
      metadata: (record.metadata as Record<string, unknown>) ?? {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  /**
   * Convierte la entidad de dominio Bag al esquema de persistencia para guardar en DB
   */
  public static toPersistence(domain: Bag): BagDbInsert {
    return this.toPersistenceInsert(domain);
  }

  /**
   * Convierte la entidad de dominio Bag al esquema de inserción en DB
   */
  public static toPersistenceInsert(domain: Bag): BagDbInsert {
    const props = domain.toPrimitives();

    return {
      id: props.id,
      categoryId: props.categoryId ?? null,
      name: props.name,
      slug: props.slug,
      skuPrefix: props.skuPrefix ?? null,
      description: props.description ?? null,
      shortDescription: props.shortDescription ?? null,
      careInstructions: props.careInstructions ?? null,
      basePrice: props.basePrice.toString(),
      compareAtPrice:
        props.compareAtPrice != null ? props.compareAtPrice.toString() : null,
      taxRate: props.taxRate != null ? props.taxRate.toString() : '19.00',
      currency: props.currency ?? 'COP',
      material: props.material ?? null,
      liningMaterial: props.liningMaterial ?? null,
      hardwareMaterial: props.hardwareMaterial ?? null,
      dimensions: props.dimensions ?? null,
      capacityLiters:
        props.capacityLiters != null ? props.capacityLiters.toString() : null,
      weightGrams: props.weightGrams ?? 600,
      hasLaptopSleeve: props.hasLaptopSleeve ?? false,
      maxLaptopSizeInches:
        props.maxLaptopSizeInches != null
          ? props.maxLaptopSizeInches.toString()
          : null,
      isWaterResistant: props.isWaterResistant ?? false,
      isActive: props.isActive ?? true,
      isFeatured: props.isFeatured ?? false,
      isNewArrival: props.isNewArrival ?? false,
      metaTitle: props.metaTitle ?? null,
      metaDescription: props.metaDescription ?? null,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }

  /**
   * Convierte la entidad de dominio Bag al esquema de actualización en DB
   */
  public static toPersistenceUpdate(domain: Bag): Partial<BagDbInsert> {
    const props = domain.toPrimitives();

    return {
      categoryId: props.categoryId ?? null,
      name: props.name,
      slug: props.slug,
      skuPrefix: props.skuPrefix ?? null,
      description: props.description ?? null,
      shortDescription: props.shortDescription ?? null,
      careInstructions: props.careInstructions ?? null,
      basePrice: props.basePrice.toString(),
      compareAtPrice:
        props.compareAtPrice != null ? props.compareAtPrice.toString() : null,
      taxRate: props.taxRate != null ? props.taxRate.toString() : '19.00',
      currency: props.currency ?? 'COP',
      material: props.material ?? null,
      liningMaterial: props.liningMaterial ?? null,
      hardwareMaterial: props.hardwareMaterial ?? null,
      dimensions: props.dimensions ?? null,
      capacityLiters:
        props.capacityLiters != null ? props.capacityLiters.toString() : null,
      weightGrams: props.weightGrams ?? 600,
      hasLaptopSleeve: props.hasLaptopSleeve ?? false,
      maxLaptopSizeInches:
        props.maxLaptopSizeInches != null
          ? props.maxLaptopSizeInches.toString()
          : null,
      isWaterResistant: props.isWaterResistant ?? false,
      isActive: props.isActive ?? true,
      isFeatured: props.isFeatured ?? false,
      isNewArrival: props.isNewArrival ?? false,
      metaTitle: props.metaTitle ?? null,
      metaDescription: props.metaDescription ?? null,
      metadata: props.metadata ?? {},
      updatedAt: new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }
}
