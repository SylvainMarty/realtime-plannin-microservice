import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  NatsContext,
  Payload,
} from '@nestjs/microservices';
import { PlanningService } from './planning.service';
import { PlanningEntryDto } from './dto/planning-entry.dto';
import {PlanningGateway} from "./planning.gateway";

@Controller()
export class PlanningController {
  constructor(private readonly planningService: PlanningService, private readonly planningGateway: PlanningGateway) {}

  @MessagePattern('planning.mutate.>')
  onPlanningMutateMessages(
    @Payload() data: PlanningEntryDto,
    @Ctx() context: NatsContext,
  ) {
    console.log(`onPlanningMutateMessages: ${context.getSubject()}`);
    const tokens = context.getSubject().split('.');
    try {
      this.planningService.updatePlanning(
        {
          id: data.id,
          start: new Date(data.start),
          end: new Date(data.end),
          title: data.title,
          summary: data.summary,
          content: data.content,
          attendees: data.attendees,
        },
        tokens[tokens.length - 1] as 'add' | 'remove',
      );
    } catch (e) {
      console.error(e);
    }
  }

  @MessagePattern('planning.updated')
  onPlanningUpdated(@Payload() dates: string[], @Ctx() context: NatsContext) {
    console.log(`onPlanningUpdated: ${context.getSubject()}`, dates);
    this.planningGateway.updateClients(dates);
  }
}
