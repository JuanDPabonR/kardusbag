import { Module } from '@nestjs/common';
import { PromotionsDomainModule } from '@kardusbag/promotions';
import { PromotionsController } from './controllers/promotions.controller';
import { PromotionsAdminController } from './controllers/promotions-admin.controller';

@Module({
  imports: [PromotionsDomainModule],
  controllers: [PromotionsController, PromotionsAdminController],
  exports: [PromotionsDomainModule],
})
export class PromotionsModule {}
