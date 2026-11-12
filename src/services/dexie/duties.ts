import appDb from '@db/appDb';
import {
  DutyHistoryType,
  DutyScheduleType,
  DutyType,
} from '@definition/duties';

/*
Meeting Duties tables are local-only: they are not part of backup/sync, so
there is no metadata flag to raise here.
*/

export const dbDutyTypesGetAll = async () => {
  return appDb.duty_types.toArray();
};

export const dbDutyTypesSave = async (duty: DutyType) => {
  await appDb.duty_types.put(duty);
};

export const dbDutyTypesBulkSave = async (duties: DutyType[]) => {
  await appDb.duty_types.bulkPut(duties);
};

export const dbDutySchedulesGet = async (weekOf: string) => {
  return appDb.duty_schedules.get(weekOf);
};

export const dbDutyHistoryGetAll = async () => {
  return appDb.duty_history.toArray();
};

export const dbDutyHistoryGetWeek = async (weekOf: string) => {
  return appDb.duty_history.where('weekOf').equals(weekOf).toArray();
};

/**
 * Saves a week's roster together with its history changes in one
 * transaction, so the roster and the history never disagree.
 */
export const dbDutyScheduleSaveWithHistory = async (
  schedule: DutyScheduleType,
  historyChanges: DutyHistoryType[]
) => {
  await appDb.transaction(
    'rw',
    appDb.duty_schedules,
    appDb.duty_history,
    async () => {
      await appDb.duty_schedules.put(schedule);

      if (historyChanges.length > 0) {
        await appDb.duty_history.bulkPut(historyChanges);
      }
    }
  );
};
