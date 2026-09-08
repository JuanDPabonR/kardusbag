import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BagDomainModule } from '@kardusbag/bag';
import { BagController } from './bags/bag.controller';
import { AllExceptionsFilter, ClerkAuthGuard } from '@kardusbag/shared';
import { AuthModule } from './auth/auth.module';
import { PromotionsModule } from './promotions/promotion.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: {
          ignore: (req: any) => {
            const url = req.originalUrl || req.url || '';
            return url.includes('metrics') || url.includes('health');
          },
        },
        customSuccessMessage: (req: any, res: any) =>
          `[HTTP] ${req.method} ${req.url} -> ${res.statusCode}`,
        customErrorMessage: (req: any, res: any, err: any) =>
          `[HTTP] ${req.method} ${req.url} -> ${res.statusCode} | Error: ${err.message}`,
        transport: {
          targets: [
            // Salida visual en consola
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname,req,res,responseTime',
              },
              level: 'info',
            },
            // Envío en segundo plano hacia Loki
            // Solo agregar Loki si estás en producción o si está habilitado explícitamente
            ...(process.env.ENABLE_LOKI === 'true'
              ? [
                  {
                    target: 'pino-loki',
                    options: {
                      batching: false,
                      host: process.env.LOKI_HOST || 'http://localhost:3100',
                      labels: {
                        app: 'kardusbag',
                        env: process.env.NODE_ENV || 'development',
                      },
                    },
                    level: 'info',
                  },
                ]
              : []),
          ],
        },
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
    }),
    BagDomainModule,
    AuthModule,
    PromotionsModule,
  ],
  controllers: [BagController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
