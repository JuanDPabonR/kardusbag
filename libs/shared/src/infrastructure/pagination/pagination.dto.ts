import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationParams } from '../../domain/pagination/pagination-params.interface';

export class PaginationDto implements PaginationParams {
  @ApiPropertyOptional({
    description: 'Número de página actual (inicia en 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo permitido es 100' })
  @IsOptional()
  limit = 10;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  get pageSize(): number {
    return this.limit;
  }
}
