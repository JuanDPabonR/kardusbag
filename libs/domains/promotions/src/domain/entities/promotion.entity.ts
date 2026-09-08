export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export type PromotionScope =
  | 'global'
  | 'categories'
  | 'collections'
  | 'specific_bags'
  | 'specific_variants'
  | 'attributes';

export interface PromotionAttributeRules {
  material?: string;
  isWaterResistant?: boolean;
  hasLaptopSleeve?: boolean;
  minLaptopInches?: number;
  colorNames?: string[];
}

export interface PromotionEntity {
  id: string;
  name: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  scope: PromotionScope;
  attributeRules?: PromotionAttributeRules | null;
  minOrderSubtotal?: number;
  maxDiscountAmount?: number | null;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number;
  currentUsageCount?: number;
  startsAt: Date;
  expiresAt?: Date | null;
  isActive?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  // Targets asociados
  targetVariantIds?: string[];
  targetBagIds?: string[];
  targetCategoryIds?: string[];
  targetCollectionIds?: string[];
}

export class Promotion {
  private props: PromotionEntity;

  constructor(props: PromotionEntity) {
    this.props = {
      ...props,
      code: props.code ? props.code.toUpperCase().trim() : null,
      attributeRules: props.attributeRules ?? {},
      minOrderSubtotal: props.minOrderSubtotal ?? 0,
      maxDiscountAmount: props.maxDiscountAmount ?? null,
      usageLimitTotal: props.usageLimitTotal ?? null,
      usageLimitPerCustomer: props.usageLimitPerCustomer ?? 1,
      currentUsageCount: props.currentUsageCount ?? 0,
      startsAt: props.startsAt ?? new Date(),
      expiresAt: props.expiresAt ?? null,
      isActive: props.isActive ?? true,
      deletedAt: props.deletedAt ?? null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      targetVariantIds: props.targetVariantIds ?? [],
      targetBagIds: props.targetBagIds ?? [],
      targetCategoryIds: props.targetCategoryIds ?? [],
      targetCollectionIds: props.targetCollectionIds ?? [],
    };
  }

  public isAutomatic(): boolean {
    return !this.props.code;
  }

  public isCoupon(): boolean {
    return !!this.props.code;
  }

  public hasStarted(now = new Date()): boolean {
    return this.props.startsAt <= now;
  }

  public isExpired(now = new Date()): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < now;
  }

  public hasUsageLimit(): boolean {
    return (
      this.props.usageLimitTotal !== null &&
      this.props.usageLimitTotal !== undefined
    );
  }

  public hasReachedUsageLimit(): boolean {
    if (!this.hasUsageLimit()) return false;
    return (
      (this.props.currentUsageCount ?? 0) >= (this.props.usageLimitTotal ?? 0)
    );
  }

  public isValid(now = new Date()): boolean {
    return (
      (this.props.isActive ?? true) &&
      !this.props.deletedAt &&
      this.hasStarted(now) &&
      !this.isExpired(now) &&
      !this.hasReachedUsageLimit()
    );
  }

  public incrementUsage(): void {
    this.props.currentUsageCount = (this.props.currentUsageCount ?? 0) + 1;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public toPrimitives(): PromotionEntity {
    return { ...this.props };
  }
}
