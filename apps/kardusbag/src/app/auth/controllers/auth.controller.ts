import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '@kardusbag/shared';
import { CurrentUser } from '@kardusbag/shared';

@Controller('auth')
export class AuthController {
  // Endpoint protegido (requiere sesión en Clerk)
  @Get('profile/me')
  @UseGuards(ClerkAuthGuard)
  getMyProfile(@CurrentUser('id') userId: string) {
    return {
      message: 'Acceso autorizado',
      userId,
    };
  }

  // 2. Obtener un token JWT para un usuario
  @Post('token')
  async getToken(
    @Body() body: { userId: string; session_duration_minutes: number },
  ) {
    try {
      // Solicita a la API de Clerk un token firmado para ese usuario
      const tokenResponse = await fetch('https://api.clerk.com/v1/tokens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: body.userId,
          session_duration_minutes: body.session_duration_minutes,
        }),
      });

      const data = await tokenResponse.json();
      return {
        accessToken: data.jwt,
      };
    } catch (error: any) {
      throw new BadRequestException('Error al generar el token');
    }
  }
}
