export interface BagDimensions {
  height: number;
  width: number;
  depth: number;
  unit: 'cm' | 'in';
}

export interface BagEntity {
  id: string;
  categoryId?: string | null;
  name: string;
  slug: string;
  skuPrefix?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  careInstructions?: string | null;
  basePrice: number;
  compareAtPrice?: number | null;
  taxRate?: number;
  currency?: string;
  material?: string | null;
  liningMaterial?: string | null;
  hardwareMaterial?: string | null;
  dimensions?: BagDimensions | null;
  capacityLiters?: number | null;
  weightGrams?: number;
  hasLaptopSleeve?: boolean;
  maxLaptopSizeInches?: number | null;
  isWaterResistant?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Bag {
  private props: BagEntity;

  constructor(props: BagEntity) {
    this.props = {
      ...props,
      taxRate: props.taxRate ?? 19.0,
      currency: props.currency ?? 'COP',
      weightGrams: props.weightGrams ?? 600,
      hasLaptopSleeve: props.hasLaptopSleeve ?? false,
      isWaterResistant: props.isWaterResistant ?? false,
      isActive: props.isActive ?? true,
      isFeatured: props.isFeatured ?? false,
      isNewArrival: props.isNewArrival ?? false,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }

  // Métodos de comportamiento / Reglas de negocio
  public updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('El precio base debe ser mayor a cero.');
    }
    this.props.basePrice = newPrice;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Retornar copia de datos planos (DTO interno)
  public toPrimitives(): BagEntity {
    return { ...this.props };
  }
}
