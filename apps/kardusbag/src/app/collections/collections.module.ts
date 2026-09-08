import { Module } from '@nestjs/common';
import { CollectionsDomainModule } from '@kardusbag/collections';
import { CollectionsAdminController } from './controllers/collections-admin.controller';
import { CollectionsController } from './controllers/collections.controller';

@Module({
  imports: [CollectionsDomainModule],
  controllers: [CollectionsAdminController, CollectionsController],
  exports: [CollectionsDomainModule],
})
export class CollectionsModule {}
