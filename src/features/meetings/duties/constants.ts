import {
  DutyMeeting,
  DutyMeetingOption,
  DutyShortageReason,
  DutyWarningReason,
} from '@definition/duties';

export const DUTY_MEETING_KEYS: Record<DutyMeeting, string> = {
  midweek: 'tr_midweekMeeting',
  weekend: 'tr_weekendMeeting',
};

export const DUTY_MEETING_OPTION_KEYS: Record<DutyMeetingOption, string> = {
  both: 'tr_dutyMeetingBoth',
  midweek: 'tr_midweekMeeting',
  weekend: 'tr_weekendMeeting',
};

export const DUTY_WARNING_KEYS: Record<DutyWarningReason, string> = {
  not_eligible: 'tr_dutyWarningNotEligible',
  away: 'tr_dutyWarningAway',
  inactive: 'tr_dutyWarningInactive',
  double_booked: 'tr_dutyWarningDoubleBooked',
};

export const DUTY_SHORTAGE_KEYS: Record<DutyShortageReason, string> = {
  no_eligible: 'tr_dutyShortageNoEligible',
  all_unavailable: 'tr_dutyShortageAllUnavailable',
  all_busy: 'tr_dutyShortageAllBusy',
};
