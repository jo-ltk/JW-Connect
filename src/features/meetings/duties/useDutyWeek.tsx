import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { personsState } from '@states/persons';
import { schedulesState } from '@states/schedules';
import {
  displayNameMeetingsEnableState,
  fullnameOptionState,
  settingsState,
} from '@states/settings';
import {
  dutyHistoryActiveState,
  dutySchedulesDbState,
  dutyTypesState,
} from '@states/duties';
import {
  DutyMeeting,
  DutySlot,
  DutyType,
  DutyWarningReason,
} from '@definition/duties';
import {
  dutiesGetWeekMeetings,
  dutiesGetWeekSlots,
  dutiesValidateWeek,
  dutyPersonName,
} from '@services/app/duties';
import { weeksBetween } from '@services/app/duty_engine';

export type DutyRowView = {
  slot: DutySlot;
  duty: DutyType;
  personName: string;
  warnings: DutyWarningReason[];
};

export type DutyMeetingView = {
  meeting: DutyMeeting;
  meeting_date: string;
  held: boolean;
  rows: DutyRowView[];
};

export type DutyWeekStatus = 'not_started' | 'draft' | 'published';

const useDutyWeek = (weekOf: string) => {
  // subscribed so the view refreshes when any of these change
  const duties = useAtomValue(dutyTypesState);
  const schedules = useAtomValue(dutySchedulesDbState);
  const persons = useAtomValue(personsState);
  const sched = useAtomValue(schedulesState);
  const settings = useAtomValue(settingsState);
  const displayNameEnabled = useAtomValue(displayNameMeetingsEnableState);
  const fullnameOption = useAtomValue(fullnameOptionState);
  const history = useAtomValue(dutyHistoryActiveState);

  const personNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of persons) {
      map.set(person.person_uid, dutyPersonName(person));
    }
    return map;
    // names depend on the display options as well
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons, displayNameEnabled, fullnameOption]);

  const stored = useMemo(
    () => schedules.find((record) => record.weekOf === weekOf),
    [schedules, weekOf]
  );

  const meetings = useMemo<DutyMeetingView[]>(() => {
    if (!weekOf) return [];

    const dutyByUid = new Map(duties.map((duty) => [duty.duty_uid, duty]));
    const slots = dutiesGetWeekSlots(weekOf);
    const warnings = dutiesValidateWeek(weekOf);

    return dutiesGetWeekMeetings(weekOf).map((info) => ({
      ...info,
      rows: slots
        .filter((slot) => slot.meeting === info.meeting)
        .map((slot) => ({
          slot,
          duty: dutyByUid.get(slot.duty_uid)!,
          personName: slot.person_uid
            ? (personNames.get(slot.person_uid) ?? '')
            : '',
          warnings: warnings
            .filter((warning) => warning.slot_id === slot.id)
            .map((warning) => warning.reason),
        })),
    }));
    // settings and sched change meeting dates and week types
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOf, duties, stored, persons, personNames, sched, settings]);

  const rows = meetings.flatMap((meeting) => meeting.rows);
  const total = rows.length;
  const filled = rows.filter((row) => row.slot.person_uid).length;

  const status: DutyWeekStatus = !stored
    ? 'not_started'
    : stored.status === 'published'
      ? 'published'
      : 'draft';

  /** Weeks since the person last had this duty (Infinity when never). */
  const lastServed = (person_uid: string, duty_uid: string) => {
    const weeks = history
      .filter(
        (record) =>
          record.person_uid === person_uid &&
          record.duty_uid === duty_uid &&
          record.weekOf < weekOf
      )
      .map((record) => weeksBetween(record.weekOf, weekOf));

    return weeks.length > 0 ? Math.min(...weeks) : Infinity;
  };

  return {
    meetings,
    rows,
    total,
    filled,
    status,
    personNames,
    lastServed,
  };
};

export default useDutyWeek;
