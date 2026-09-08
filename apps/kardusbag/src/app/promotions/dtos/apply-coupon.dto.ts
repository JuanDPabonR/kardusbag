import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Código de cupón a redimir',
    example: 'VERANO2026',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
