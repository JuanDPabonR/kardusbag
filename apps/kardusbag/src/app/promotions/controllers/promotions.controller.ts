import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromotionsService } from '@kardusbag/promotions';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';

@ApiTags('Cart Promotions')
@Controller('cart')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post(':cartId/coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aplica un cupón de descuento a un carrito' })
  @ApiResponse({ status: 200, description: 'Cupón aplicado exitosamente' })
  async applyCoupon(
    @Param('cartId', ParseUUIDPipe) cartId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return await this.promotionsService.applyCoupon(cartId, dto.code);
  }
}
