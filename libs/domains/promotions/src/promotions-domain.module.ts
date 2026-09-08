import { Module } from '@nestjs/common';
import { db } from '@kardusbag/database';
import { PROMOTION_REPOSITORY_PORT } from './domain/ports/promotion-repository.port';
import {
  PromotionRepository,
  DRIZZLE_DB,
} from './infrastructure/persistence/promotion.repository';
import { PromotionsAdminService } from './application/services/promotions-admin.service';
import { PromotionsService } from './application/services/promotions.service';

@Module({
  providers: [
    PromotionsAdminService,
    PromotionsService,
    {
      provide: DRIZZLE_DB,
      useValue: db,
    },
    {
      provide: PROMOTION_REPOSITORY_PORT,
      useClass: PromotionRepository,
    },
  ],
  exports: [
    PromotionsAdminService,
    PromotionsService,
    PROMOTION_REPOSITORY_PORT,
  ],
})
export class PromotionsDomainModule {}
