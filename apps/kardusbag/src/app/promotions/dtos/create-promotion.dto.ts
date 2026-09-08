import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum DiscountTypeDto {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export enum PromotionScopeDto {
  GLOBAL = 'global',
  CATEGORIES = 'categories',
  COLLECTIONS = 'collections',
  SPECIFIC_BAGS = 'specific_bags',
  SPECIFIC_VARIANTS = 'specific_variants',
  ATTRIBUTES = 'attributes',
}

export class AttributeRulesDto {
  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsBoolean()
  isWaterResistant?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLaptopSleeve?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minLaptopInches?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorNames?: string[];
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Si se omite o viene null/vacío, se interpreta como descuento automático de catálogo
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : null))
  code?: string | null;

  @IsEnum(DiscountTypeDto)
  type: DiscountTypeDto;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value: number;

  @IsEnum(PromotionScopeDto)
  scope: PromotionScopeDto;

  // Reglas dinámicas (solo si scope === 'attributes')
  @IsOptional()
  @ValidateNested()
  @Type(() => AttributeRulesDto)
  attributeRules?: AttributeRulesDto;

  // IDs de Categorías (solo si scope === 'categories')
  @ValidateIf((o) => o.scope === PromotionScopeDto.CATEGORIES)
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  // IDs de Colecciones (solo si scope === 'collections')
  @ValidateIf((o) => o.scope === PromotionScopeDto.COLLECTIONS)
  @IsArray()
  @IsUUID('4', { each: true })
  collectionIds?: string[];

  // IDs de Bolsos Matriz (solo si scope === 'specific_bags')
  @ValidateIf((o) => o.scope === PromotionScopeDto.SPECIFIC_BAGS)
  @IsArray()
  @IsUUID('4', { each: true })
  bagIds?: string[];

  // IDs de Variantes (solo si scope === 'specific_variants')
  @ValidateIf((o) => o.scope === PromotionScopeDto.SPECIFIC_VARIANTS)
  @IsArray()
  @IsUUID('4', { each: true })
  variantIds?: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderSubtotal?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxDiscountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerCustomer?: number;

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
