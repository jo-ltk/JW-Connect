import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { schedulesState } from '@states/schedules';
import { shortDateFormatState } from '@states/settings';
import { ASSIGNMENT_PATH } from '@constants/index';
import { schedulesGetData } from '@services/app/schedules';
import { formatDate } from '@utils/date';
import { AssignmentCongregation } from '@definition/schedules';

const JUST_SAVED_MS = 4000;

/**
 * Organized writes every assignment straight to IndexedDB and stamps it with
 * `updatedAt`. The schedules atom only changes after that write, so the most
 * recent stamp of this meeting is the moment it was last saved.
 */
const useSavedIndicator = (
  week: string,
  meeting: 'midweek' | 'weekend',
  dataView: string
) => {
  const schedules = useAtomValue(schedulesState);
  const shortDateFormat = useAtomValue(shortDateFormatState);

  const lastSaved = useMemo(() => {
    const schedule = schedules.find((record) => record.weekOf === week);
    if (!schedule) return '';

    const prefix = meeting === 'midweek' ? 'MM_' : 'WM_';

    const dates: string[] = [];

    for (const [key, path] of Object.entries(ASSIGNMENT_PATH)) {
      if (!key.startsWith(prefix) || key.endsWith('CircuitOverseer')) continue;

      // with a data view, a single record (or nothing) comes back
      const assigned = schedulesGetData(
        schedule,
        path,
        dataView
      ) as AssignmentCongregation;

      if (assigned?.updatedAt) dates.push(assigned.updatedAt);
    }

    return dates.sort().at(-1) ?? '';
  }, [schedules, week, meeting, dataView]);

  // "Saved just now" only for changes made while this screen is open
  const [justSaved, setJustSaved] = useState(false);
  const previous = useRef({ key: `${week}|${meeting}`, value: lastSaved });

  useEffect(() => {
    const key = `${week}|${meeting}`;

    if (previous.current.key !== key) {
      previous.current = { key, value: lastSaved };
      setJustSaved(false);
      return;
    }

    if (lastSaved && lastSaved > previous.current.value) {
      previous.current.value = lastSaved;
      setJustSaved(true);

      const timer = setTimeout(() => setJustSaved(false), JUST_SAVED_MS);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, week, meeting]);

  const savedLabel = useMemo(() => {
    if (!lastSaved) return '';

    const date = new Date(lastSaved);
    if (isNaN(date.getTime())) return '';

    const isToday =
      formatDate(date, 'yyyy/MM/dd') === formatDate(new Date(), 'yyyy/MM/dd');

    return isToday
      ? formatDate(date, 'HH:mm')
      : formatDate(date, shortDateFormat);
  }, [lastSaved, shortDateFormat]);

  return { justSaved, savedLabel };
};

export default useSavedIndicator;
