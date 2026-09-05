import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '@kardusbag/shared';
import { CurrentUser } from '@kardusbag/shared';
import { AuthSyncService } from '../services/auth-sync.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authSyncService: AuthSyncService) {}

  // Endpoint protegido (requiere sesión en Clerk)
  @Get('profile/me')
  @UseGuards(ClerkAuthGuard)
  getMyProfile(@CurrentUser('id') userId: string) {
    return {
      message: 'Acceso autorizado',
      userId,
    };
  }

  @Post('sync')
  async syncUser(@Req() req: any) {
    // req.user.id viene del token verificado por ClerkAuthGuard (el 'sub' de Clerk)
    const clerkId = req.user.id;
    return this.authSyncService.syncCurrentUser(clerkId);
  }
}
