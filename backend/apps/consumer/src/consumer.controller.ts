import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  NatsContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class ConsumerController {
  constructor(@Inject('EVENT_SERVICE') private readonly client: ClientProxy) {}

  @MessagePattern('events')
  onEvents(@Payload() data: unknown, @Ctx() context: NatsContext) {
    console.log(`onEvents Subject: ${context.getSubject()}`, data);
    this.client.emit<number>('planning.updated', {
      message: 'wahouuuu ' + JSON.stringify(data),
    });
  }
}
