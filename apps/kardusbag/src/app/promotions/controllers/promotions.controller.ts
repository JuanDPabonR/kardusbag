import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PromotionsService } from '../services/promotions.service';

export class ApplyCouponDto {
  code: string;
}

@Controller('cart')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post(':cartId/coupon')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Param('cartId') cartId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.promotionsService.applyCouponToCart(cartId, dto.code);
  }
}
