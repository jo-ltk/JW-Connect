/*
Business logic of the Meeting Duties organizer.

UI → (this file) → @services/dexie/duties → IndexedDB → atoms (@states/duties)

The scheduling rules live in ./duty_engine (pure functions, unit tested).
This file connects them to Organized data: persons, time away, meeting days
and week types.
*/

import { store } from '@states/index';
import { personsState } from '@states/persons';
import { schedulesState } from '@states/schedules';
import {
  displayNameMeetingsEnableState,
  fullnameOptionState,
  settingsState,
} from '@states/settings';
import {
  dutySchedulesDbState,
  dutyTypesDbState,
  dutyTypesState,
} from '@states/duties';
import {
  DutyCandidate,
  DutyEngineResult,
  DutyMeeting,
  DutyScheduleStatus,
  DutyScheduleType,
  DutySlot,
  DutyType,
  DutyTypeData,
  DutyWarning,
} from '@definition/duties';
import { PersonType } from '@definition/person';
import { Week } from '@definition/week_type';
import { WEEK_TYPE_NO_MEETING } from '@constants/index';
import { addDays, formatDate } from '@utils/date';
import { personGetDisplayName } from '@utils/common';
import { getTranslation } from '@services/i18n/translation';
import { isPersonBlockedOnDate } from '@services/app/persons';
import { schedulesResolveMeetingDate } from '@services/app/schedules';
import {
  dbDutyHistoryGetAll,
  dbDutyHistoryGetWeek,
  dbDutyScheduleSaveWithHistory,
  dbDutySchedulesGet,
  dbDutyTypesBulkSave,
  dbDutyTypesGetAll,
  dbDutyTypesSave,
} from '@services/dexie/duties';
import {
  DutyMeetingInfo,
  buildWeekSlots,
  dutyCheckAssignment,
  dutyReconcileHistory,
  dutyValidateSlots,
  generateDutyRoster,
} from './duty_engine';

const DEFAULT_DUTY_KEYS = [
  'tr_dutySoundConsole',
  'tr_dutyStageAttendant',
  'tr_dutyMicrophone1',
  'tr_dutyMicrophone2',
];

export const DUTY_MAX_REQUIRED = 10;

/** Error with a translation key as message (tr_dutyError…). */
export class DutyError extends Error {}

const newDutyData = (
  name: string,
  sort_index: number,
  now: string
): DutyTypeData => ({
  _deleted: false,
  updatedAt: now,
  name,
  meeting: 'both',
  required: 1,
  eligible: [],
  active: true,
  sort_index,
});

let ensureDefaultsRun: Promise<void> | undefined;

/** Creates the four starting duties the first time the page is opened. */
export const dutiesEnsureDefaults = () => {
  ensureDefaultsRun ??= (async () => {
    const existing = await dbDutyTypesGetAll();
    if (existing.length > 0) return;

    const now = new Date().toISOString();

    const duties: DutyType[] = DEFAULT_DUTY_KEYS.map((key, index) => ({
      duty_uid: crypto.randomUUID(),
      duty_data: newDutyData(getTranslation({ key }), index, now),
    }));

    await dbDutyTypesBulkSave(duties);
  })();

  return ensureDefaultsRun;
};

export const dutyCreateEmpty = (): DutyType => {
  const duties = store.get(dutyTypesState);
  const sort_index =
    duties.reduce((max, duty) => Math.max(max, duty.duty_data.sort_index), -1) +
    1;

  return {
    duty_uid: crypto.randomUUID(),
    duty_data: newDutyData('', sort_index, new Date().toISOString()),
  };
};

export const dutySave = async (duty: DutyType) => {
  const name = duty.duty_data.name.trim();
  if (name.length === 0) throw new DutyError('tr_dutyErrorNameRequired');

  const required = Math.min(
    DUTY_MAX_REQUIRED,
    Math.max(1, Math.round(duty.duty_data.required) || 1)
  );

  await dbDutyTypesSave({
    ...duty,
    duty_data: {
      ...duty.duty_data,
      name,
      required,
      updatedAt: new Date().toISOString(),
    },
  });
};

/** Duties are soft-deleted so their history keeps a valid reference. */
export const dutyDelete = async (duty: DutyType) => {
  await dbDutyTypesSave({
    ...duty,
    duty_data: {
      ...duty.duty_data,
      _deleted: true,
      active: false,
      updatedAt: new Date().toISOString(),
    },
  });
};

export const dutyMove = async (duty_uid: string, direction: -1 | 1) => {
  const duties = [...store.get(dutyTypesState)];
  const index = duties.findIndex((duty) => duty.duty_uid === duty_uid);
  const target = index + direction;

  if (index < 0 || target < 0 || target >= duties.length) return;

  [duties[index], duties[target]] = [duties[target], duties[index]];

  const now = new Date().toISOString();

  await dbDutyTypesBulkSave(
    duties.map((duty, sort_index) => ({
      ...duty,
      duty_data: { ...duty.duty_data, sort_index, updatedAt: now },
    }))
  );
};

/** Baptized brothers who are active: a sensible starting list for duties. */
export const dutySuggestedEligible = () => {
  const persons = store.get(personsState);

  return persons
    .filter((person) => {
      if (person._deleted.value) return false;
      if (person.person_data.archived?.value) return false;
      if (person.person_data.disqualified?.value) return false;
      if (!person.person_data.male.value) return false;

      return person.person_data.publisher_baptized.active.value;
    })
    .map((person) => person.person_uid);
};

export const dutyPersonName = (person: PersonType) => {
  const displayNameEnabled = store.get(displayNameMeetingsEnableState);
  const fullnameOption = store.get(fullnameOptionState);

  return personGetDisplayName(person, displayNameEnabled, fullnameOption);
};

export const dutyBuildCandidates = (persons: PersonType[]): DutyCandidate[] =>
  persons.map((person) => ({
    person_uid: person.person_uid,
    name: dutyPersonName(person),
    inactive:
      person._deleted.value ||
      (person.person_data.archived?.value ?? false) ||
      (person.person_data.disqualified?.value ?? false),
    isAwayOn: (date: string) => isPersonBlockedOnDate(person, date),
  }));

export type DutyWeekMeeting = DutyMeetingInfo & {
  // false when the week type means there is no meeting (assembly, convention…)
  held: boolean;
};

/**
 * Meetings of a week with their dates, following the congregation meeting
 * days, circuit overseer week and week types of the main congregation.
 */
export const dutiesGetWeekMeetings = (weekOf: string): DutyWeekMeeting[] => {
  const settings = store.get(settingsState);
  const schedule = store
    .get(schedulesState)
    .find((record) => record.weekOf === weekOf);

  return (['midweek', 'weekend'] as DutyMeeting[]).map((meeting) => {
    let date: Date;

    if (schedule) {
      date = schedulesResolveMeetingDate({
        settings,
        schedule,
        meeting,
        dataView: 'main',
      });
    } else {
      const config = settings.cong_settings[`${meeting}_meeting`].find(
        (record) => record.type === 'main'
      );
      const weekday = config?.weekday.value ?? (meeting === 'midweek' ? 2 : 6);
      date = addDays(weekOf, weekday);
    }

    const weekType =
      schedule?.[`${meeting}_meeting`]?.week_type?.find(
        (record) => record.type === 'main'
      )?.value ?? Week.NORMAL;

    return {
      meeting,
      meeting_date: formatDate(date, 'yyyy/MM/dd'),
      held: !WEEK_TYPE_NO_MEETING.includes(weekType),
    };
  });
};

const heldMeetings = (weekOf: string): DutyMeetingInfo[] =>
  dutiesGetWeekMeetings(weekOf)
    .filter((record) => record.held)
    .map(({ meeting, meeting_date }) => ({ meeting, meeting_date }));

const getSchedule = (weekOf: string): DutyScheduleType | undefined =>
  store.get(dutySchedulesDbState).find((record) => record.weekOf === weekOf);

/** The slots shown for a week: one per active duty and position. */
export const dutiesGetWeekSlots = (weekOf: string): DutySlot[] => {
  return buildWeekSlots(
    store.get(dutyTypesState),
    heldMeetings(weekOf),
    getSchedule(weekOf)?.slots ?? []
  );
};

export const dutiesValidateWeek = (weekOf: string): DutyWarning[] => {
  return dutyValidateSlots({
    slots: dutiesGetWeekSlots(weekOf),
    duties: store.get(dutyTypesState),
    meetings: heldMeetings(weekOf),
    candidates: dutyBuildCandidates(store.get(personsState)),
  });
};

/*
Changes always start from what is stored in IndexedDB (not from the atoms,
which refresh a moment later), so quick successive edits cannot work on an
outdated copy of the week.
*/
type WeekContext = {
  weekOf: string;
  stored?: DutyScheduleType;
  slots: DutySlot[];
  meetings: DutyMeetingInfo[];
};

const loadWeek = async (weekOf: string): Promise<WeekContext> => {
  const stored = await dbDutySchedulesGet(weekOf);
  const meetings = heldMeetings(weekOf);

  return {
    weekOf,
    stored,
    meetings,
    slots: buildWeekSlots(
      store.get(dutyTypesState),
      meetings,
      stored?.slots ?? []
    ),
  };
};

/**
 * Saves a week's slots and records the history changes. Any change of
 * people brings the week back to draft: it must be published again on purpose.
 */
const saveWeek = async (
  context: WeekContext,
  status: DutyScheduleStatus = 'draft'
) => {
  const { weekOf, stored, slots, meetings } = context;

  // keep slots of duties that are switched off, so nothing is lost if the
  // duty is switched on again
  const kept = (stored?.slots ?? []).filter(
    (slot) => !slots.some((item) => item.id === slot.id)
  );

  const historyChanges = dutyReconcileHistory({
    weekOf,
    slots,
    history: await dbDutyHistoryGetWeek(weekOf),
    duties: store.get(dutyTypesDbState),
    meetings,
  });

  await dbDutyScheduleSaveWithHistory(
    {
      weekOf,
      status,
      updatedAt: new Date().toISOString(),
      slots: [...slots, ...kept],
    },
    historyChanges
  );
};

/**
 * Fills every empty or automatic slot of the week. Locked slots and manual
 * assignments are kept. The result is saved as a draft.
 */
export const dutiesGenerateWeek = async (
  weekOf: string
): Promise<DutyEngineResult> => {
  const context = await loadWeek(weekOf);

  const result = generateDutyRoster({
    weekOf,
    meetings: context.meetings,
    duties: store.get(dutyTypesState),
    existingSlots: context.slots,
    history: await dbDutyHistoryGetAll(),
    candidates: dutyBuildCandidates(store.get(personsState)),
  });

  await saveWeek({ ...context, slots: result.slots });

  return result;
};

const findSlot = (slots: DutySlot[], slot_id: string) => {
  const slot = slots.find((record) => record.id === slot_id);
  if (!slot) throw new DutyError('tr_dutyErrorSlotNotFound');
  return slot;
};

const checkPerson = (
  context: WeekContext,
  slot: DutySlot,
  person_uid: string
) => {
  const duty = store
    .get(dutyTypesState)
    .find((record) => record.duty_uid === slot.duty_uid)!;
  const meeting_date =
    context.meetings.find((record) => record.meeting === slot.meeting)
      ?.meeting_date ?? context.weekOf;
  const person = store
    .get(personsState)
    .find((record) => record.person_uid === person_uid);

  return dutyCheckAssignment({
    duty,
    person_uid,
    candidate: person ? dutyBuildCandidates([person])[0] : undefined,
    meeting_date,
    othersInMeeting: context.slots
      .filter(
        (record) =>
          record.id !== slot.id &&
          record.meeting === slot.meeting &&
          record.person_uid
      )
      .map((record) => record.person_uid),
  });
};

const WARNING_ERROR_KEYS = {
  not_eligible: 'tr_dutyWarningNotEligible',
  away: 'tr_dutyWarningAway',
  inactive: 'tr_dutyWarningInactive',
  double_booked: 'tr_dutyWarningDoubleBooked',
} as const;

/**
 * Checks whether a person may take a slot, from the data on screen. Returns
 * the problems; an empty list means the person can be chosen.
 */
export const dutyCheckPersonForSlot = (
  weekOf: string,
  slot_id: string,
  person_uid: string
) => {
  const context: WeekContext = {
    weekOf,
    meetings: heldMeetings(weekOf),
    slots: dutiesGetWeekSlots(weekOf),
  };

  return checkPerson(context, findSlot(context.slots, slot_id), person_uid);
};

/** Manual assignment. Refuses ineligible, away or double-booked people. */
export const dutyAssignPerson = async (
  weekOf: string,
  slot_id: string,
  person_uid: string
) => {
  const context = await loadWeek(weekOf);
  const slot = findSlot(context.slots, slot_id);

  if (slot.locked) throw new DutyError('tr_dutyErrorLocked');

  const problems = checkPerson(context, slot, person_uid);
  if (problems.length > 0) {
    throw new DutyError(WARNING_ERROR_KEYS[problems[0]]);
  }

  slot.person_uid = person_uid;
  slot.source = 'manual';
  slot.updatedAt = new Date().toISOString();

  await saveWeek(context);
};

/**
 * Empties a slot. Regenerating fills it again unless the slot is locked
 * (lock an empty slot to keep it empty on purpose).
 */
export const dutyRemovePerson = async (weekOf: string, slot_id: string) => {
  const context = await loadWeek(weekOf);
  const slot = findSlot(context.slots, slot_id);

  if (slot.locked) throw new DutyError('tr_dutyErrorLocked');

  slot.person_uid = '';
  slot.source = 'auto';
  slot.updatedAt = new Date().toISOString();

  await saveWeek(context);
};

export const dutyToggleLock = async (weekOf: string, slot_id: string) => {
  const context = await loadWeek(weekOf);
  const slot = findSlot(context.slots, slot_id);

  slot.locked = !slot.locked;
  slot.updatedAt = new Date().toISOString();

  await saveWeek(context, context.stored?.status ?? 'draft');
};

/**
 * Swaps the people of two slots. Both must stay valid after the swap
 * (eligible for the other duty, available, not double-booked).
 */
export const dutySwapSlots = async (
  weekOf: string,
  slot_a: string,
  slot_b: string
) => {
  const context = await loadWeek(weekOf);
  const a = findSlot(context.slots, slot_a);
  const b = findSlot(context.slots, slot_b);

  if (a.locked || b.locked) throw new DutyError('tr_dutyErrorLocked');

  const now = new Date().toISOString();
  [a.person_uid, b.person_uid] = [b.person_uid, a.person_uid];

  for (const slot of [a, b]) {
    slot.source = 'manual';
    slot.updatedAt = now;
  }

  const problems = dutyValidateSlots({
    slots: context.slots,
    duties: store.get(dutyTypesState),
    meetings: context.meetings,
    candidates: dutyBuildCandidates(store.get(personsState)),
  }).filter((warning) => warning.slot_id === a.id || warning.slot_id === b.id);

  if (problems.length > 0) {
    throw new DutyError(WARNING_ERROR_KEYS[problems[0].reason]);
  }

  await saveWeek(context);
};

export const dutySetWeekStatus = async (
  weekOf: string,
  status: DutyScheduleStatus
) => {
  await saveWeek(await loadWeek(weekOf), status);
};
