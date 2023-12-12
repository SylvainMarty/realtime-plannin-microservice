import { Module } from '@nestjs/common';
import { NatsConfigFactory } from '@shared/config/nats-config.factory';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: ['.env', '.env.local'] })],
  providers: [NatsConfigFactory],
  exports: [NatsConfigFactory],
})
export class SharedModule {}
