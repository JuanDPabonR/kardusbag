import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  // Rutas de telemetría y monitoreo que nunca deben exigir autenticación de usuario
  private readonly INFRA_EXCLUDED_ROUTES = [
    '/api/metrics',
    '/metrics',
    '/api/health',
    '/health',
  ];

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestPath = request.originalUrl?.split('?')[0] || request.url;

    // 1. Bypass por ruta de infraestructura/monitoreo
    if (this.INFRA_EXCLUDED_ROUTES.includes(requestPath)) {
      return true;
    }

    // 2. Bypass por decorador @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 3. Validación de cabecera Authorization
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const verifiedClerk = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      request.user = {
        id: verifiedClerk.sub,
        claims: verifiedClerk,
      };
      return true;
    } catch (clerkErr: any) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          const localDecoded = jwt.verify(
            token,
            process.env.CLERK_SECRET_KEY as string,
          ) as any;

          request.user = {
            id: localDecoded.sub,
            claims: localDecoded,
          };
          return true;
        } catch (localErr: any) {
          this.logger.error(
            `Error verificando token local: ${localErr.message}`,
          );
        }
      }

      this.logger.error(`Error validando token: ${clerkErr.message}`);
      throw new UnauthorizedException(
        'Error al validar la sesión de autenticación',
      );
    }
  }
}
