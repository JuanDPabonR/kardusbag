import { Module } from '@nestjs/common';
import { db } from '@kardusbag/database';
import { BAG_REPOSITORY_PORT } from './domain/ports/bag-repository.port';
import {
  BagRepository,
  DRIZZLE_DB,
} from './infrastructure/persistence/bag.repository';
import { GetBagByIdUseCase } from './application/use-cases/get-bag-by-id.use-case';
import { CreateBagUseCase } from './application/use-cases/create-bag.use-case';

@Module({
  providers: [
    GetBagByIdUseCase,
    CreateBagUseCase,
    {
      provide: DRIZZLE_DB,
      useValue: db,
    },
    {
      provide: BAG_REPOSITORY_PORT,
      useClass: BagRepository,
    },
  ],
  exports: [
    GetBagByIdUseCase,
    CreateBagUseCase,
    BAG_REPOSITORY_PORT, // Por si otro módulo necesita consultar el puerto directamente
  ],
})
export class BagDomainModule {}
