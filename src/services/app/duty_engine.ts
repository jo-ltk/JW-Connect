/*
Duty assignment engine for the Meeting Duties organizer.

This module is pure: it does not read IndexedDB or Jotai atoms, so it can be
unit tested directly (see tests/duties). The caller passes every input.

It follows the same fairness principles as the meeting-part autofill
(services/app/assignment_selection.ts), adapted to duties:

1. Recent repeat     – avoid giving the same duty again within RECENT_REPEAT_WEEKS
2. Load this week    – prefer people without another duty this week
3. Rotation spacing  – let every eligible person take a turn before anyone
                       repeats (spacing = pool size / weekly frequency)
4. Longest waiting   – prefer the person who has gone longest without this duty
5. Duty fairness     – fewer of this duty in the fairness window
6. Overall fairness  – fewer duties of any kind in the fairness window
7. Stable tie-break  – deterministic per week, so results do not flip around

Hard rules (never broken by the engine):
- only people in the duty's eligible list are considered
- inactive people and people away on the meeting date are skipped
- one person never holds two duties in the same meeting
- locked slots and manual assignments are kept exactly as they are
*/

import {
  DutyCandidate,
  DutyEngineResult,
  DutyHistoryType,
  DutyMeeting,
  DutyShortage,
  DutySlot,
  DutyType,
  DutyWarning,
  DutyWarningReason,
} from '@definition/duties';

export const RECENT_REPEAT_WEEKS = 4;

// assignments further than this from the target week do not affect fairness
export const DUTY_FAIRNESS_WINDOW_WEEKS = 26;

export type DutyMeetingInfo = {
  meeting: DutyMeeting;
  // yyyy/MM/dd
  meeting_date: string;
};

export type DutyEngineInput = {
  weekOf: string;
  meetings: DutyMeetingInfo[];
  duties: DutyType[];
  existingSlots: DutySlot[];
  // assignment history of all weeks; only `active` records are used
  history: DutyHistoryType[];
  candidates: DutyCandidate[];
  now?: string;
};

export const dutySlotId = (
  meeting: DutyMeeting,
  duty_uid: string,
  index: number
) => `${meeting}:${duty_uid}:${index}`;

export const dutyAppliesToMeeting = (duty: DutyType, meeting: DutyMeeting) => {
  const value = duty.duty_data.meeting;
  return value === 'both' || value === meeting;
};

export const dutyIsUsable = (duty: DutyType) =>
  !duty.duty_data._deleted && duty.duty_data.active;

export const sortDuties = (duties: DutyType[]) =>
  [...duties].sort((a, b) => {
    if (a.duty_data.sort_index !== b.duty_data.sort_index) {
      return a.duty_data.sort_index - b.duty_data.sort_index;
    }
    return a.duty_data.name.localeCompare(b.duty_data.name);
  });

/** Parses yyyy/MM/dd (or yyyy-MM-dd) as a local date. */
const parseDay = (value: string) => {
  const [y, m, d] = value.split(/[/-]/).map(Number);
  return new Date(y, m - 1, d);
};

/** Whole weeks from `from` to `to` (negative when `to` is earlier). */
export const weeksBetween = (from: string, to: string) => {
  const diff = parseDay(to).getTime() - parseDay(from).getTime();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
};

/**
 * Builds the list of slots a week should have, from the active duties and
 * the meetings held that week. Existing slot data is kept by id.
 */
export const buildWeekSlots = (
  duties: DutyType[],
  meetings: DutyMeetingInfo[],
  existingSlots: DutySlot[],
  now: string = new Date().toISOString()
): DutySlot[] => {
  const existing = new Map(existingSlots.map((slot) => [slot.id, slot]));
  const result: DutySlot[] = [];

  for (const { meeting } of meetings) {
    for (const duty of sortDuties(duties.filter(dutyIsUsable))) {
      if (!dutyAppliesToMeeting(duty, meeting)) continue;

      const required = Math.max(1, duty.duty_data.required);

      for (let index = 0; index < required; index++) {
        const id = dutySlotId(meeting, duty.duty_uid, index);
        const found = existing.get(id);

        result.push(
          found
            ? { ...found }
            : {
                id,
                meeting,
                duty_uid: duty.duty_uid,
                index,
                person_uid: '',
                source: 'auto',
                locked: false,
                updatedAt: now,
              }
        );
      }
    }
  }

  return result;
};

/** A slot the engine must not change. */
export const dutySlotIsPinned = (slot: DutySlot) =>
  slot.locked || (slot.source === 'manual' && slot.person_uid.length > 0);

/**
 * Checks a person against a slot. Returns every problem found; an empty list
 * means the assignment is valid.
 */
export const dutyCheckAssignment = ({
  duty,
  person_uid,
  candidate,
  meeting_date,
  othersInMeeting,
}: {
  duty: DutyType;
  person_uid: string;
  candidate?: DutyCandidate;
  meeting_date: string;
  othersInMeeting: string[];
}): DutyWarningReason[] => {
  const problems: DutyWarningReason[] = [];

  if (!duty.duty_data.eligible.includes(person_uid)) {
    problems.push('not_eligible');
  }

  if (!candidate || candidate.inactive) {
    problems.push('inactive');
  } else if (candidate.isAwayOn(meeting_date)) {
    problems.push('away');
  }

  if (othersInMeeting.includes(person_uid)) {
    problems.push('double_booked');
  }

  return problems;
};

type CandidateMeta = {
  person_uid: string;
  recentDeficit: number;
  tasksThisWeek: number;
  spacingDeficit: number;
  closestSame: number;
  sameDutyCount: number;
  totalCount: number;
  tieBreak: number;
};

// small deterministic string hash (FNV-1a)
const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const compareDutyCandidates = (a: CandidateMeta, b: CandidateMeta) => {
  if (a.recentDeficit !== b.recentDeficit) {
    return a.recentDeficit - b.recentDeficit;
  }
  if (a.tasksThisWeek !== b.tasksThisWeek) {
    return a.tasksThisWeek - b.tasksThisWeek;
  }
  if (a.spacingDeficit !== b.spacingDeficit) {
    return a.spacingDeficit - b.spacingDeficit;
  }
  if (a.closestSame !== b.closestSame) {
    return b.closestSame - a.closestSame;
  }
  if (a.sameDutyCount !== b.sameDutyCount) {
    return a.sameDutyCount - b.sameDutyCount;
  }
  if (a.totalCount !== b.totalCount) {
    return a.totalCount - b.totalCount;
  }
  if (a.tieBreak !== b.tieBreak) {
    return a.tieBreak - b.tieBreak;
  }
  return a.person_uid.localeCompare(b.person_uid);
};

/**
 * Generates a draft roster for one week.
 *
 * Pinned slots (locked, or manually assigned) are kept untouched. Every other
 * slot is cleared and filled again. Slots that cannot be filled are reported
 * in `shortages`; problems with pinned slots are reported in `warnings`.
 */
export const generateDutyRoster = (
  input: DutyEngineInput
): DutyEngineResult => {
  const now = input.now ?? new Date().toISOString();
  const { weekOf, meetings, history } = input;

  const duties = input.duties.filter(dutyIsUsable);
  const dutyByUid = new Map(duties.map((duty) => [duty.duty_uid, duty]));
  const candidateByUid = new Map(
    input.candidates.map((candidate) => [candidate.person_uid, candidate])
  );
  const dateByMeeting = new Map(
    meetings.map((record) => [record.meeting, record.meeting_date])
  );

  const slots = buildWeekSlots(duties, meetings, input.existingSlots, now).map(
    (slot) =>
      dutySlotIsPinned(slot)
        ? slot
        : { ...slot, person_uid: '', source: 'auto' as const, updatedAt: now }
  );

  const shortages: DutyShortage[] = [];
  const warnings: DutyWarning[] = [];

  // people already holding a duty in each meeting of this week
  const busy = new Map<DutyMeeting, string[]>(
    meetings.map((record) => [record.meeting, []])
  );

  for (const slot of slots) {
    if (!slot.person_uid) continue;

    const duty = dutyByUid.get(slot.duty_uid)!;
    const meetingBusy = busy.get(slot.meeting)!;

    const problems = dutyCheckAssignment({
      duty,
      person_uid: slot.person_uid,
      candidate: candidateByUid.get(slot.person_uid),
      meeting_date: dateByMeeting.get(slot.meeting)!,
      othersInMeeting: meetingBusy,
    });

    for (const reason of problems) {
      warnings.push({ slot_id: slot.id, person_uid: slot.person_uid, reason });
    }

    meetingBusy.push(slot.person_uid);
  }

  // history of other weeks, inside the fairness window
  const pastAndPlanned = history.filter(
    (record) =>
      record.status === 'active' &&
      record.weekOf !== weekOf &&
      Math.abs(weeksBetween(weekOf, record.weekOf)) <=
        DUTY_FAIRNESS_WINDOW_WEEKS
  );

  const weeklyFrequency = new Map<string, number>();
  for (const slot of slots) {
    weeklyFrequency.set(
      slot.duty_uid,
      (weeklyFrequency.get(slot.duty_uid) ?? 0) + 1
    );
  }

  const assignedThisWeek = () =>
    slots.filter((slot) => slot.person_uid).map((slot) => slot.person_uid);

  const buildMeta = (person_uid: string, duty: DutyType): CandidateMeta => {
    const own = pastAndPlanned.filter(
      (record) => record.person_uid === person_uid
    );
    const same = own.filter((record) => record.duty_uid === duty.duty_uid);

    const closestSame = same.reduce(
      (min, record) =>
        Math.min(min, Math.abs(weeksBetween(weekOf, record.weekOf))),
      Infinity
    );

    const poolSize = duty.duty_data.eligible.length;
    const frequency = weeklyFrequency.get(duty.duty_uid) ?? 1;
    const rotationWeeks = Math.max(1, Math.floor(poolSize / frequency));

    return {
      person_uid,
      recentDeficit: Math.max(0, RECENT_REPEAT_WEEKS - closestSame),
      tasksThisWeek: assignedThisWeek().filter((uid) => uid === person_uid)
        .length,
      spacingDeficit:
        rotationWeeks > 1 ? Math.max(0, rotationWeeks - closestSame) : 0,
      closestSame,
      sameDutyCount: same.length,
      totalCount: own.length,
      tieBreak: hashString(`${weekOf}|${duty.duty_uid}|${person_uid}`),
    };
  };

  const freeCandidates = (slot: DutySlot) => {
    const duty = dutyByUid.get(slot.duty_uid)!;
    const meeting_date = dateByMeeting.get(slot.meeting)!;
    const meetingBusy = busy.get(slot.meeting)!;

    const pool = duty.duty_data.eligible.filter((uid) => {
      const candidate = candidateByUid.get(uid);
      return candidate && !candidate.inactive;
    });

    const available = pool.filter(
      (uid) => !candidateByUid.get(uid)!.isAwayOn(meeting_date)
    );

    const free = available.filter((uid) => !meetingBusy.includes(uid));

    return { duty, pool, available, free };
  };

  let open = slots.filter((slot) => !slot.person_uid && !slot.locked);

  // fill the most constrained slot first, so scarce people go where needed
  while (open.length > 0) {
    let next = open[0];
    let nextInfo = freeCandidates(next);

    for (const slot of open.slice(1)) {
      const info = freeCandidates(slot);
      if (info.free.length < nextInfo.free.length) {
        next = slot;
        nextInfo = info;
      }
    }

    open = open.filter((slot) => slot.id !== next.id);

    const { duty, pool, available, free } = nextInfo;

    if (free.length === 0) {
      shortages.push({
        slot_id: next.id,
        duty_uid: next.duty_uid,
        meeting: next.meeting,
        reason:
          pool.length === 0
            ? 'no_eligible'
            : available.length === 0
              ? 'all_unavailable'
              : 'all_busy',
      });
      continue;
    }

    const ranked = free
      .map((uid) => buildMeta(uid, duty))
      .sort(compareDutyCandidates);

    const chosen = ranked[0].person_uid;

    next.person_uid = chosen;
    next.source = 'auto';
    next.updatedAt = now;
    busy.get(next.meeting)!.push(chosen);
  }

  return { slots, shortages, warnings };
};

/**
 * Works out the history changes for a week after its slots changed.
 *
 * History is never deleted: when a slot's person changes, the previous active
 * record is marked `replaced` (or `removed` when the slot is now empty) and a
 * new `active` record is added. Records of slots that no longer exist in the
 * week (e.g. a duty was switched off) stay untouched.
 *
 * @returns Only the records that must be written (changed or new).
 */
export const dutyReconcileHistory = ({
  weekOf,
  slots,
  history,
  duties,
  meetings,
  now = new Date().toISOString(),
  makeId = () => crypto.randomUUID(),
}: {
  weekOf: string;
  slots: DutySlot[];
  history: DutyHistoryType[];
  duties: DutyType[];
  meetings: DutyMeetingInfo[];
  now?: string;
  makeId?: () => string;
}): DutyHistoryType[] => {
  const dutyByUid = new Map(duties.map((duty) => [duty.duty_uid, duty]));
  const dateByMeeting = new Map(
    meetings.map((record) => [record.meeting, record.meeting_date])
  );

  const activeBySlot = new Map(
    history
      .filter(
        (record) => record.weekOf === weekOf && record.status === 'active'
      )
      .map((record) => [record.slot_id, record])
  );

  const changes: DutyHistoryType[] = [];

  for (const slot of slots) {
    const current = activeBySlot.get(slot.id);

    if (current && current.person_uid === slot.person_uid) {
      // same person: only the source can change (auto → manual)
      if (current.source !== slot.source) {
        changes.push({ ...current, source: slot.source });
      }
      continue;
    }

    if (current) {
      changes.push({
        ...current,
        status: slot.person_uid ? 'replaced' : 'removed',
        ended_at: now,
      });
    }

    if (slot.person_uid) {
      changes.push({
        id: makeId(),
        slot_id: slot.id,
        weekOf,
        meeting: slot.meeting,
        meeting_date: dateByMeeting.get(slot.meeting) ?? weekOf,
        duty_uid: slot.duty_uid,
        duty_name: dutyByUid.get(slot.duty_uid)?.duty_data.name ?? '',
        person_uid: slot.person_uid,
        source: slot.source,
        status: 'active',
        created_at: now,
      });
    }
  }

  return changes;
};

/**
 * Lists every problem in a week's current slots (used to show warnings
 * after manual edits, without running the generator).
 */
export const dutyValidateSlots = ({
  slots,
  duties,
  meetings,
  candidates,
}: {
  slots: DutySlot[];
  duties: DutyType[];
  meetings: DutyMeetingInfo[];
  candidates: DutyCandidate[];
}): DutyWarning[] => {
  const dutyByUid = new Map(duties.map((duty) => [duty.duty_uid, duty]));
  const candidateByUid = new Map(
    candidates.map((candidate) => [candidate.person_uid, candidate])
  );
  const dateByMeeting = new Map(
    meetings.map((record) => [record.meeting, record.meeting_date])
  );

  const warnings: DutyWarning[] = [];

  for (const slot of slots) {
    if (!slot.person_uid) continue;

    const duty = dutyByUid.get(slot.duty_uid);
    const meeting_date = dateByMeeting.get(slot.meeting);
    if (!duty || !meeting_date) continue;

    const othersInMeeting = slots
      .filter(
        (other) =>
          other.id !== slot.id &&
          other.meeting === slot.meeting &&
          other.person_uid
      )
      .map((other) => other.person_uid);

    const problems = dutyCheckAssignment({
      duty,
      person_uid: slot.person_uid,
      candidate: candidateByUid.get(slot.person_uid),
      meeting_date,
      othersInMeeting,
    });

    for (const reason of problems) {
      warnings.push({ slot_id: slot.id, person_uid: slot.person_uid, reason });
    }
  }

  return warnings;
};
