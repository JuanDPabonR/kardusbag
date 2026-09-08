import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from './pagination-response.dto';

export class PaginatedDataDto<T> {
  @ApiProperty({
    isArray: true,
    description: 'Elementos del conjunto de datos',
  })
  items: T[];

  @ApiProperty({
    type: () => PaginationResponse,
    description: 'Metadatos de paginación',
  })
  pagination: PaginationResponse;

  constructor(items: T[], pagination: PaginationResponse) {
    this.items = items;
    this.pagination = pagination;
  }
}
