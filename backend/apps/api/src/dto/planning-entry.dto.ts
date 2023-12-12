export interface PlanningEntryDto {
  id: string;
  title: string;
  summary: string;
  content: string;
  start: Date;
  end: Date;
  attendees: string[];
}
