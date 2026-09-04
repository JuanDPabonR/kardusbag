import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BagDomainModule } from '@kardusbag/bag';
import { BagController } from './bags/bag.controller';

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
})
export class AppModule {}
