import { Table } from 'dexie';
import {
  DutyHistoryType,
  DutyScheduleType,
  DutyType,
} from '@definition/duties';

export type DutiesTable = {
  duty_types: Table<DutyType>;
  duty_schedules: Table<DutyScheduleType>;
  duty_history: Table<DutyHistoryType>;
};

// local-only tables of the Meeting Duties organizer (not synced)
export const dutiesSchema = {
  duty_types: '&duty_uid, duty_data',
  duty_schedules: '&weekOf',
  duty_history: '&id, weekOf, person_uid, duty_uid, status',
};
