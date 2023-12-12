import { addDays, format } from 'date-fns';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlanningDateDto } from './dto/planning-date.dto';
import { PlanningEntryDto } from './dto/planning-entry.dto';
import { ClientProxy } from '@nestjs/microservices';

const DATE_INDEX_FORMAT = 'yyyy-MM-dd';

@Injectable()
export class PlanningService {
  private logger = new Logger(PlanningService.name);
  private planning: Record<string, PlanningDateDto> = {};
  private sortedPlanningKeys: string[] = [];

  constructor(@Inject('BROKER') private readonly client: ClientProxy) {}

  getPlanning(from: Date, to: Date): PlanningDateDto[] {
    const start = format(from, DATE_INDEX_FORMAT);
    const end = format(addDays(to, 1), DATE_INDEX_FORMAT);
    let foundStart = false;
    const result = [];
    for (const currDate of this.sortedPlanningKeys) {
      if (currDate === end) {
        break;
      }
      if (currDate === start) {
        foundStart = true;
      }
      if (foundStart) {
        result.push(this.planning[currDate]);
      }
    }
    return result;
  }

  updatePlanning(entry: PlanningEntryDto, action: 'add' | 'remove'): void {
    const start = format(entry.start, DATE_INDEX_FORMAT);
    const end = format(entry.end, DATE_INDEX_FORMAT);
    const existingEntryEndDate = this.updatePlanningEntry(start, entry, action);
    const updatedKeys = [start];
    if (start !== end) {
      this.updatePlanningEntry(end, entry, action);
      updatedKeys.push(end);
    }
    if (existingEntryEndDate && ![start, end].includes(existingEntryEndDate)) {
      this.updatePlanningEntry(existingEntryEndDate, entry, 'remove');
      updatedKeys.push(existingEntryEndDate);
    }
    this.sortedPlanningKeys = Object.keys(this.planning).sort();
    console.log(this.planning);
    this.client.emit('planning.updated', updatedKeys);
  }

  private updatePlanningEntry(
    dateString: string,
    entry: PlanningEntryDto,
    action: 'add' | 'remove',
  ): string | null {
    let existingEntryEndDate = null;
    if (action === 'remove' && !this.planning[dateString]) {
      return null;
    }

    switch (action) {
      case 'add':
        if (!this.planning[dateString]) {
          this.planning[dateString] = { date: dateString, entries: [] };
        }
        const existingEntryIdx = this.planning[dateString].entries.findIndex(
          (e) => e.id === entry.id,
        );
        if (existingEntryIdx !== -1) {
          existingEntryEndDate = format(
            this.planning[dateString].entries[existingEntryIdx].end,
            DATE_INDEX_FORMAT,
          );
          this.planning[dateString].entries[existingEntryIdx] = entry;
        } else {
          this.planning[dateString].entries.push(entry);
        }
        break;
      case 'remove':
        const entryToDeleteIdx = this.planning[dateString].entries.findIndex(
          (e) => e.id === entry.id,
        );
        if (entryToDeleteIdx !== -1) {
          existingEntryEndDate = format(
            this.planning[dateString].entries[entryToDeleteIdx].end,
            DATE_INDEX_FORMAT,
          );
          delete this.planning[dateString].entries[entryToDeleteIdx];
          if (this.planning[dateString].entries.length === 0) {
            delete this.planning[dateString];
          }
        } else {
          this.logger.warn(
            `Trying to remove entry ${entry.id} from planning but it does not exist`,
          );
        }
        break;
    }

    return existingEntryEndDate;
  }
}
