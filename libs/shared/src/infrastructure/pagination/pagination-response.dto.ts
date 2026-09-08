import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse {
  @ApiProperty({ description: 'Total de páginas calculadas', example: 5 })
  pages: number;

  @ApiProperty({ description: 'Total de elementos encontrados', example: 50 })
  totalItems: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Cantidad de elementos por página', example: 10 })
  pageSize: number;

  constructor(props?: {
    pages: number;
    totalItems: number;
    page: number;
    pageSize: number;
  }) {
    if (props) {
      this.pages = props.pages;
      this.totalItems = props.totalItems;
      this.page = props.page;
      this.pageSize = props.pageSize;
    }
  }
}
