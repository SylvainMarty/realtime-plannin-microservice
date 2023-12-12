import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { NatsConfigFactory, SharedModule } from '@shared';
import { PlanningService } from './planning.service';
import { ClientProxyFactory } from '@nestjs/microservices';
import { PlanningGateway } from './planning.gateway';

@Module({
  imports: [SharedModule],
  controllers: [PlanningController],
  providers: [
    {
      provide: 'BROKER',
      useFactory: (factory: NatsConfigFactory) => {
        return ClientProxyFactory.create(factory.create());
      },
      inject: [NatsConfigFactory],
    },
    PlanningService,
    PlanningGateway,
  ],
})
export class AppModule {}
