import { Module } from '@nestjs/common';
import { CollectionsDomainModule } from '@kardusbag/collections';
import { CollectionsAdminController } from './controllers/collections-admin.controller';

@Module({
  imports: [CollectionsDomainModule],
  controllers: [CollectionsAdminController],
  exports: [CollectionsDomainModule],
})
export class CollectionsModule {}
