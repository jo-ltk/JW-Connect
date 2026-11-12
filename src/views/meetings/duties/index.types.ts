export type MeetingDutiesPDFRow = {
  position: string;
  person: string;
};

export type MeetingDutiesPDFMeeting = {
  title: string;
  date: string;
  // shown instead of the rows when there is no meeting
  note?: string;
  rows: MeetingDutiesPDFRow[];
};

export type TemplateMeetingDutiesProps = {
  title: string;
  congregation: string;
  lang: string;
  weekLabel: string;
  // shown when the roster is not published yet
  draftLabel?: string;
  meetings: MeetingDutiesPDFMeeting[];
};
