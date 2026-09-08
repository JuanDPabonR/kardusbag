import { Module } from '@nestjs/common';
import { db } from '@kardusbag/database';
import { PromotionsController } from './controllers/promotions.controller';
import { PromotionsService } from './services/promotions.service';

@Module({
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    {
      provide: 'DRIZZLE_DB',
      useValue: db,
    },
  ],
  exports: [PromotionsService],
})
export class PromotionsModule {}
