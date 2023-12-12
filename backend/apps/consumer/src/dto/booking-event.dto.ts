export interface BookingEventDto {
  start: Date;
  end: Date;
  reference: string;
  status: 'booked' | 'cancelled';
  item: { name: string };
  customer: { firstname: string; lastname: string; phone: string };
  guides: Array<{ firstname: string; lastname: string; email: string }>;
}
