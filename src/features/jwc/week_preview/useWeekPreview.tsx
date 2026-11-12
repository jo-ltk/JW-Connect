import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { schedulesState } from '@states/schedules';
import { sourcesState } from '@states/sources';
import { JWLangState, userDataViewState } from '@states/settings';
import { WEEK_TYPE_NO_MEETING } from '@constants/index';
import { Week } from '@definition/week_type';
import {
  schedulesGetMeetingDate,
  schedulesWeekAssignmentsInfo,
} from '@services/app/schedules';
import { jwcCurrentWeek, jwcPickWeek } from '../weeks';

export type JwcMeetingPreview = {
  dateLabel: string;
  subtitle: string;
  hasMeeting: boolean;
  assigned: number;
  total: number;
};

/** Current week's meetings, read from the real schedules and sources. */
const useWeekPreview = () => {
  const sources = useAtomValue(sourcesState);
  const schedules = useAtomValue(schedulesState);
  const dataView = useAtomValue(userDataViewState);
  const lang = useAtomValue(JWLangState);

  const weeks = useMemo(
    () => sources.map((record) => record.weekOf).sort(),
    [sources]
  );

  const week = useMemo(() => jwcPickWeek(weeks, jwcCurrentWeek()), [weeks]);

  const isCurrentWeek = week === jwcCurrentWeek();

  const { midweek, weekend } = useMemo(() => {
    const schedule = schedules.find((record) => record.weekOf === week);
    const source = sources.find((record) => record.weekOf === week);

    const build = (meeting: 'midweek' | 'weekend'): JwcMeetingPreview => {
      const empty = {
        dateLabel: '',
        subtitle: '',
        hasMeeting: false,
        assigned: 0,
        total: 0,
      };

      if (!week || !schedule) return empty;

      const weekType =
        schedule[`${meeting}_meeting`].week_type.find(
          (record) => record.type === dataView
        )?.value ?? Week.NORMAL;

      const info = schedulesWeekAssignmentsInfo(week, meeting);

      const subtitle =
        meeting === 'midweek'
          ? (source?.midweek_meeting.weekly_bible_reading?.[lang] ?? '')
          : '';

      return {
        dateLabel: schedulesGetMeetingDate({ week, meeting }).locale,
        subtitle,
        hasMeeting: !WEEK_TYPE_NO_MEETING.includes(weekType),
        assigned: info.assigned,
        total: info.total,
      };
    };

    return { midweek: build('midweek'), weekend: build('weekend') };
  }, [week, schedules, sources, dataView, lang]);

  return { week, isCurrentWeek, midweek, weekend, dataView };
};

export default useWeekPreview;
