// apps/kardusbag/src/app/bags/dtos/create-bag.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BagDimensions } from '@kardusbag/bag';

export class BagDimensionsDto implements BagDimensions {
  @ApiProperty({ description: 'Altura en la unidad especificada', example: 45 })
  @IsNumber()
  @IsPositive()
  height: number;

  @ApiProperty({ description: 'Ancho en la unidad especificada', example: 30 })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({
    description: 'Profundidad en la unidad especificada',
    example: 15,
  })
  @IsNumber()
  @IsPositive()
  depth: number;

  @ApiProperty({
    description: 'Unidad de medida',
    enum: ['cm', 'in'],
    example: 'cm',
  })
  @IsIn(['cm', 'in'])
  unit: 'cm' | 'in';
}

export class CreateBagDto {
  // ==========================================
  // Identificación & Clasificación básica
  // ==========================================

  @ApiProperty({
    description: 'Nombre comercial del bolso',
    example: 'Mochila Urbana Kardus',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Slug único para la URL del producto',
    example: 'mochila-urbana-kardus',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({
    description: 'ID de la categoría asignada (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Prefijo base para SKU de variantes',
    example: 'KB-URB',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  skuPrefix?: string;

  // ==========================================
  // Textos & Descripciones
  // ==========================================

  @ApiPropertyOptional({
    description: 'Descripción breve para catálogo o previews',
    example: 'Mochila elegante y funcional para uso diario.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'Descripción completa detallando confección y compartimentos',
    example: 'Fabricada con materiales de alta calidad...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Instrucciones de cuidado y limpieza',
    example: 'Limpiar con un paño húmedo. No usar blanqueador.',
  })
  @IsString()
  @IsOptional()
  careInstructions?: string;

  // ==========================================
  // Precios & Moneda
  // ==========================================

  @ApiProperty({
    description: 'Precio base de venta',
    example: 189900,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({
    description: 'Precio tachado de referencia para ofertas',
    example: 229900,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de IVA aplicado',
    example: 19.0,
    default: 19.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Código ISO de la moneda (3 caracteres)',
    example: 'COP',
    default: 'COP',
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  // ==========================================
  // Materiales & Dimensiones Físicas
  // ==========================================

  @ApiPropertyOptional({
    description: 'Composición textil exterior',
    example: 'Lona encerada de algodón 100%',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  material?: string;

  @ApiPropertyOptional({
    description: 'Composición textil interna / forro',
    example: 'Poliéster impermeable de alta densidad',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  liningMaterial?: string;

  @ApiPropertyOptional({
    description: 'Especificación de herrajes',
    example: 'Cremalleras metálicas YKK y hebillas de latón',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  hardwareMaterial?: string;

  @ApiPropertyOptional({
    description: 'Dimensiones físicas volumétricas',
    type: () => BagDimensionsDto,
  })
  @ValidateNested()
  @Type(() => BagDimensionsDto)
  @IsOptional()
  dimensions?: BagDimensionsDto;

  @ApiPropertyOptional({
    description: 'Volumen interior útil expresado en litros',
    example: 22.5,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacityLiters?: number;

  @ApiPropertyOptional({
    description: 'Masa física en gramos para envíos y flete',
    example: 600,
    default: 600,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightGrams?: number;

  // ==========================================
  // Características & Especificaciones
  // ==========================================

  @ApiPropertyOptional({
    description: 'Indica si incluye compartimento acolchado para laptop',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasLaptopSleeve?: boolean;

  @ApiPropertyOptional({
    description: 'Dimensión diagonal máxima en pulgadas para portátiles',
    example: 15.6,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxLaptopSizeInches?: number;

  @ApiPropertyOptional({
    description: 'Indica si cuenta con resistencia a salpicaduras o agua',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isWaterResistant?: boolean;

  // ==========================================
  // Visibilidad & Marketing
  // ==========================================

  @ApiPropertyOptional({
    description: 'Visibilidad del producto en la tienda pública',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si es un producto destacado en la tienda',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si está catalogado como nuevo lanzamiento',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isNewArrival?: boolean;

  // ==========================================
  // SEO & Metadatos
  // ==========================================

  @ApiPropertyOptional({
    description: 'Título SEO personalizado para la etiqueta <title>',
    example: 'Mochila Urbana de Cuero y Lona | Kardus',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Descripción SEO para el tag meta description',
    example: 'Compra la mejor mochila urbana artesanal en Kardus.',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Atributos y metadatos adicionales en formato clave-valor',
    example: { coleccion: 'Otoño 2026', impermeable: true },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
