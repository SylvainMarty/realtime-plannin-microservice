import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { SharedModule, NatsConfigFactory } from '@shared';

@Module({
  imports: [SharedModule],
  controllers: [ConsumerController],
  providers: [
    {
      provide: 'EVENT_SERVICE',
      useFactory: (factory: NatsConfigFactory) => {
        return ClientProxyFactory.create(factory.create());
      },
      inject: [NatsConfigFactory],
    },
  ],
})
export class ConsumerModule {}
