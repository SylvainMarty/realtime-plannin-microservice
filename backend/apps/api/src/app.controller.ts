import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  NatsContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern('planning.>')
  onPlanningMessages(@Payload() data: unknown, @Ctx() context: NatsContext) {
    console.log(`onPlanningMessages Subject: ${context.getSubject()}`, data);
  }
}
