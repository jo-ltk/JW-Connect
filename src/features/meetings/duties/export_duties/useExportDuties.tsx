import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { pdf } from '@react-pdf/renderer';
import saveAs from 'file-saver';
import { useAppTranslation } from '@hooks/index';
import { congNameState, JWLangLocaleState } from '@states/settings';
import { getMessageByCode } from '@services/i18n/translation';
import { displaySnackNotification } from '@services/states/app';
import { dateFormatFriendly, formatDate } from '@utils/date';
import { DUTY_MEETING_KEYS } from '../constants';
import useDutyWeek from '../useDutyWeek';
import TemplateMeetingDuties from '@views/meetings/duties';

const useExportDuties = (weekOf: string) => {
  const { t } = useAppTranslation();

  const locale = useAtomValue(JWLangLocaleState);
  const congName = useAtomValue(congNameState);

  const week = useDutyWeek(weekOf);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      const meetings = week.meetings.map((meeting) => ({
        title: t(DUTY_MEETING_KEYS[meeting.meeting]),
        date: dateFormatFriendly(meeting.meeting_date),
        note: meeting.held ? undefined : t('tr_dutyNoMeetingThisWeek'),
        rows: meeting.held
          ? meeting.rows.map((row) => ({
              position:
                row.duty.duty_data.required > 1
                  ? `${row.duty.duty_data.name} ${row.slot.index + 1}`
                  : row.duty.duty_data.name,
              person: row.personName,
            }))
          : [],
      }));

      const blob = await pdf(
        <TemplateMeetingDuties
          title={t('tr_meetingDuties')}
          congregation={congName}
          lang={locale}
          weekLabel={t('tr_dutyWeekOf', { date: dateFormatFriendly(weekOf) })}
          draftLabel={
            week.status === 'published' ? undefined : t('tr_dutyStatusDraft')
          }
          meetings={meetings}
        />
      ).toBlob();

      const filename = `MeetingDuties_${formatDate(new Date(weekOf), 'yyyyMMdd')}.pdf`;

      saveAs(blob, filename);
    } catch (error) {
      console.error(error);
      displaySnackNotification({
        header: getMessageByCode('error_app_generic-title'),
        message: getMessageByCode((error as Error).message),
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, handleExport };
};

export default useExportDuties;
