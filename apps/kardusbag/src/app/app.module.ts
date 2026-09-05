import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BagDomainModule } from '@kardusbag/bag';
import { BagController } from './bags/bag.controller';
import { AllExceptionsFilter, ClerkAuthGuard } from '@kardusbag/shared';
import { AuthController } from './auth/controllers/auth.controller';
import { AuthSyncController } from './auth/controllers/auth-sync.controller';

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
            {
              target: 'pino-loki',
              options: {
                batching: false,
                host: 'http://localhost:3100',
                labels: {
                  app: 'kardusbag',
                  env: process.env.NODE_ENV || 'development',
                },
              },
              level: 'info',
            },
          ],
        },
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
    }),
    BagDomainModule,
  ],
  controllers: [BagController, AuthController, AuthSyncController],
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
