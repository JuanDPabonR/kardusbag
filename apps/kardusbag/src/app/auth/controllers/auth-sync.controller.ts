import { Controller, Post, Req } from '@nestjs/common';
import { AuthSyncService } from '../services/auth-sync.service';

@Controller('auth')
export class AuthSyncController {
  constructor(private readonly authSyncService: AuthSyncService) {}

  // Este endpoint NO lleva @Public(), por ende ClerkAuthGuard exige el Bearer token
  @Post('sync')
  async syncUser(@Req() req: any) {
    // req.user.id viene del token verificado por ClerkAuthGuard (el 'sub' de Clerk)
    const clerkId = req.user.id;
    return this.authSyncService.syncCurrentUser(clerkId);
  }
}
