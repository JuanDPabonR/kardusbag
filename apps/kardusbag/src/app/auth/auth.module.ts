import { Module } from '@nestjs/common';
import { db } from '@kardusbag/database';
import { AuthController } from './controllers/auth.controller';
import { AuthSyncService } from './services/auth-sync.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthSyncService,
    {
      provide: 'DRIZZLE_DB',
      useValue: db,
    },
  ],
  exports: [AuthSyncService],
})
export class AuthModule {}
