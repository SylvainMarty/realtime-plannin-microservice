import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { NatsConfigFactory } from '@shared';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  const factory = app.get(NatsConfigFactory);
  app.connectMicroservice<MicroserviceOptions>(
    factory.create({
      options: {
        queue: 'planning_queue',
      },
    }),
  );

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
