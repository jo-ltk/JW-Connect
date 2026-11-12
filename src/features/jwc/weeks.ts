import { formatDate, getWeekDate } from '@utils/date';

/** Monday of the current week, in the yyyy/MM/dd key used by sources and schedules. */
export const jwcCurrentWeek = () =>
  formatDate(getWeekDate(new Date()), 'yyyy/MM/dd');

/** Monday of the week that contains `date`. */
export const jwcWeekOf = (date: Date | string) =>
  formatDate(getWeekDate(new Date(date)), 'yyyy/MM/dd');

/**
 * Chooses the week to show from the weeks that have meeting materials:
 * the wanted week if it exists, otherwise the next one after it, otherwise
 * the last one before it.
 */
export const jwcPickWeek = (weeks: string[], wanted: string) => {
  if (weeks.length === 0) return '';
  if (weeks.includes(wanted)) return wanted;

  const next = weeks.find((week) => week > wanted);
  if (next) return next;

  return weeks.at(-1) ?? '';
};
