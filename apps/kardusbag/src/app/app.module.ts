import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BagDomainModule } from '@kardusbag/bag';
import { BagController } from './bags/bag.controller';
import { AllExceptionsFilter } from '@kardusbag/shared';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
    }),
    BagDomainModule,
  ],
  controllers: [BagController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
