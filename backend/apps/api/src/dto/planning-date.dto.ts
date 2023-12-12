import { PlanningEntryDto } from './planning-entry.dto';

export interface PlanningDateDto {
  date: string;
  entries: PlanningEntryDto[];
}
