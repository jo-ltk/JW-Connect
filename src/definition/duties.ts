/*
Types for the Meeting Duties organizer (sound, stage, microphones and any
other duty the congregation defines). All data is local-only (IndexedDB).
*/

export type DutyMeeting = 'midweek' | 'weekend';

export type DutyMeetingOption = DutyMeeting | 'both';

export type DutyTypeData = {
  _deleted: boolean;
  updatedAt: string;
  name: string;
  meeting: DutyMeetingOption;
  // number of people needed for this duty at each meeting
  required: number;
  // person_uid of everyone allowed to take this duty
  eligible: string[];
  active: boolean;
  sort_index: number;
};

export type DutyType = {
  duty_uid: string;
  duty_data: DutyTypeData;
};

export type DutyAssignmentSource = 'auto' | 'manual';

export type DutySlot = {
  // `${meeting}:${duty_uid}:${index}`
  id: string;
  meeting: DutyMeeting;
  duty_uid: string;
  index: number;
  person_uid: string;
  source: DutyAssignmentSource;
  locked: boolean;
  updatedAt: string;
};

export type DutyScheduleStatus = 'draft' | 'published';

export type DutyScheduleType = {
  // Monday of the week, yyyy/MM/dd (same convention as the sched table)
  weekOf: string;
  status: DutyScheduleStatus;
  updatedAt: string;
  slots: DutySlot[];
};

export type DutyHistoryStatus = 'active' | 'replaced' | 'removed';

export type DutyHistoryType = {
  id: string;
  slot_id: string;
  weekOf: string;
  meeting: DutyMeeting;
  meeting_date: string;
  duty_uid: string;
  // snapshot of the duty name when the assignment was made
  duty_name: string;
  person_uid: string;
  source: DutyAssignmentSource;
  status: DutyHistoryStatus;
  created_at: string;
  ended_at?: string;
};

/** A person as seen by the duty engine: only what the engine needs. */
export type DutyCandidate = {
  person_uid: string;
  name: string;
  // true when the person cannot take any duty (archived, disqualified, deleted)
  inactive: boolean;
  // yyyy/MM/dd dates on which the person is away
  isAwayOn: (date: string) => boolean;
};

export type DutySlotView = {
  slot: DutySlot;
  duty: DutyType;
  meeting_date: string;
};

export type DutyShortageReason = 'no_eligible' | 'all_unavailable' | 'all_busy';

export type DutyShortage = {
  slot_id: string;
  duty_uid: string;
  meeting: DutyMeeting;
  reason: DutyShortageReason;
};

export type DutyWarningReason =
  'not_eligible' | 'away' | 'inactive' | 'double_booked';

export type DutyWarning = {
  slot_id: string;
  person_uid: string;
  reason: DutyWarningReason;
};

export type DutyEngineResult = {
  slots: DutySlot[];
  shortages: DutyShortage[];
  warnings: DutyWarning[];
};
