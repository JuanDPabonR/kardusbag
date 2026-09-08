import { ApiProperty } from '@nestjs/swagger';

export class AppResponse<T = any> {
  @ApiProperty({ description: 'Código de estado HTTP', example: 200 })
  status: number;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Operación exitosa',
  })
  message: string;

  @ApiProperty({
    description: 'Datos devueltos por la operación',
    nullable: true,
  })
  data?: T;

  constructor(status: number, message: string, data?: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
