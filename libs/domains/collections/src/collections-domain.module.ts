import { Module } from '@nestjs/common';
import { db } from '@kardusbag/database';
import { COLLECTION_REPOSITORY_PORT } from './domain/ports/collection-repository.port';
import {
  CollectionRepository,
  DRIZZLE_DB,
} from './infrastructure/persistence/collection.repository';
import { CollectionsAdminService } from './application/services/collection-admin.service';

@Module({
  providers: [
    CollectionsAdminService,
    {
      provide: DRIZZLE_DB,
      useValue: db,
    },
    {
      provide: COLLECTION_REPOSITORY_PORT,
      useClass: CollectionRepository,
    },
  ],
  exports: [CollectionsAdminService, COLLECTION_REPOSITORY_PORT],
})
export class CollectionsDomainModule {}
