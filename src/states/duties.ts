/*
This file holds the source of the truth from the tables "duty_types",
"duty_schedules" and "duty_history".
*/

import { atom } from 'jotai';
import {
  DutyHistoryType,
  DutyScheduleType,
  DutyType,
} from '@definition/duties';
import { sortDuties } from '@services/app/duty_engine';

export const dutyTypesDbState = atom<DutyType[]>([]);

export const dutySchedulesDbState = atom<DutyScheduleType[]>([]);

export const dutyHistoryDbState = atom<DutyHistoryType[]>([]);

// true once the duty tables have been read at least once
export const dutiesLoadedState = atom(false);

export const dutyTypesState = atom((get) => {
  const duties = get(dutyTypesDbState);
  return sortDuties(duties.filter((record) => !record.duty_data._deleted));
});

export const dutyTypesActiveState = atom((get) => {
  const duties = get(dutyTypesState);
  return duties.filter((record) => record.duty_data.active);
});

export const dutyHistoryActiveState = atom((get) => {
  const history = get(dutyHistoryDbState);
  return history.filter((record) => record.status === 'active');
});

// Monday (yyyy/MM/dd) of the week shown in the Meeting Duties page
export const dutiesSelectedWeekState = atom('');
