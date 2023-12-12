import { NestFactory } from '@nestjs/core';
import { ConsumerModule } from './consumer.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { NatsConfigFactory } from '@shared';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ConsumerModule);
  const factory = app.get(NatsConfigFactory);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      ConsumerModule,
      factory.create({
        options: {
          queue: 'events_queue',
        },
      }),
    );
  await microservice.listen();
}
bootstrap();
