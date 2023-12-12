import { merge } from 'lodash';
import { Injectable } from '@nestjs/common';
import { NatsOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NatsConfigFactory {
  constructor(private readonly configService: ConfigService) {}

  create(options: Partial<NatsOptions> = {}): NatsOptions {
    return merge(
      {
        transport: Transport.NATS,
        options: {
          servers: [this.configService.get<string>('NATS_URL')],
        },
      },
      options,
    );
  }
}
