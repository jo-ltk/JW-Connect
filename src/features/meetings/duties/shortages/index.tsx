import { Box } from '@mui/material';
import { IconError } from '@components/icons';
import { useAppTranslation } from '@hooks/index';
import { DutyShortage } from '@definition/duties';
import { DutyRowView } from '../useDutyWeek';
import { DUTY_MEETING_KEYS, DUTY_SHORTAGE_KEYS } from '../constants';
import Typography from '@components/typography';

/** Lists positions the generator could not fill, and why. */
const DutyShortages = ({
  shortages,
  rows,
}: {
  shortages: DutyShortage[];
  rows: DutyRowView[];
}) => {
  const { t } = useAppTranslation();

  if (shortages.length === 0) return null;

  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--red-secondary)',
        border: '1px solid var(--red-main)',
      }}
    >
      <IconError color="var(--red-dark)" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography className="h4" color="var(--red-dark)">
          {t('tr_dutyShortageTitle', { count: shortages.length })}
        </Typography>
        <Box component="ul" sx={{ margin: 0, paddingInlineStart: '18px' }}>
          {shortages.map((shortage) => {
            const row = rows.find((item) => item.slot.id === shortage.slot_id);
            const dutyName = row?.duty.duty_data.name ?? '';

            return (
              <Typography
                component="li"
                key={shortage.slot_id}
                className="body-small-regular"
                color="var(--red-dark)"
              >
                {t(DUTY_MEETING_KEYS[shortage.meeting])} · {dutyName}:{' '}
                {t(DUTY_SHORTAGE_KEYS[shortage.reason])}
              </Typography>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default DutyShortages;
