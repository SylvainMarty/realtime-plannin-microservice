import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  NatsContext,
  Payload,
} from '@nestjs/microservices';
import { BookingEventDto } from './dto/booking-event.dto';
import { PlanningEntryDto } from '../../api/src/dto/planning-entry.dto';

@Controller()
export class ConsumerController {
  constructor(@Inject('EVENT_SERVICE') private readonly client: ClientProxy) {}

  @MessagePattern('events.order.booking.>')
  onEvents(
    @Payload() bookingEvent: BookingEventDto,
    @Ctx() context: NatsContext,
  ) {
    console.log(`onEvents Subject: ${context.getSubject()}`, bookingEvent);
    let subject;
    const payload: PlanningEntryDto = {
      id: bookingEvent.reference,
      start: bookingEvent.start,
      end: bookingEvent.end,
      title: bookingEvent.item.name,
      summary: `Booking reference: #${bookingEvent.reference}
Booking status: ${bookingEvent.status}`,
      content: `Booking reference: #${bookingEvent.reference}
Booking status: ${bookingEvent.status}
Customer: ${bookingEvent.customer.firstname} ${bookingEvent.customer.lastname} (${bookingEvent.customer.phone})
Guides:
${bookingEvent.guides.map((g) => ' - ' + g.firstname).join('\n')})`,
      attendees: bookingEvent.guides.map((g) => g.email),
    };
    switch (bookingEvent.status) {
      case 'booked':
        subject = 'planning.mutate.add';
        break;
      case 'cancelled':
        subject = 'planning.mutate.remove';
        break;
    }
    this.client.emit<number>(subject, payload);
  }
}
