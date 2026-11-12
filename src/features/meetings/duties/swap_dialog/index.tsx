import { Box, ButtonBase } from '@mui/material';
import { useAppTranslation } from '@hooks/index';
import { dutySwapSlots } from '@services/app/duties';
import { DUTY_EASE, DutyThemeVars, dutyDialogPaper } from '../duties_theme';
import { DUTY_MEETING_KEYS } from '../constants';
import { DutyRowView } from '../useDutyWeek';
import useDutyWeek from '../useDutyWeek';
import Button from '@components/button';
import Dialog from '@components/dialog';
import Typography from '@components/typography';

type DutySwapDialogProps = {
  themeVars: DutyThemeVars;
  weekOf: string;
  slotId: string;
  week: ReturnType<typeof useDutyWeek>;
  onClose: VoidFunction;
  onError: (error: unknown) => void;
};

const label = (row: DutyRowView) =>
  row.duty.duty_data.required > 1
    ? `${row.duty.duty_data.name} ${row.slot.index + 1}`
    : row.duty.duty_data.name;

/** Exchanges the people of two positions in the same week. */
const DutySwapDialog = ({
  themeVars,
  weekOf,
  slotId,
  week,
  onClose,
  onError,
}: DutySwapDialogProps) => {
  const { t } = useAppTranslation();

  const source = week.rows.find((row) => row.slot.id === slotId);
  if (!source) return null;

  const targets = week.rows.filter(
    (row) =>
      row.slot.id !== slotId &&
      !row.slot.locked &&
      (row.slot.person_uid || source.slot.person_uid)
  );

  const handleSwap = async (target: string) => {
    try {
      await dutySwapSlots(weekOf, slotId, target);
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  const personText = (row: DutyRowView) =>
    row.slot.person_uid ? row.personName : t('tr_dutyNotAssigned');

  return (
    <Dialog
      open
      onClose={onClose}
      closable
      title={t('tr_dutySwapTitle')}
      description={t('tr_dutySwapDesc', {
        duty: label(source),
        person: personText(source),
      })}
      PaperProps={dutyDialogPaper(themeVars)}
      actions={
        <Button variant="secondary" onClick={onClose} sx={{ width: '100%' }}>
          {t('tr_cancel')}
        </Button>
      }
    >
      {targets.length === 0 && (
        <Typography className="body-regular" color="var(--grey-400)">
          {t('tr_dutySwapNone')}
        </Typography>
      )}

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {targets.map((row) => (
          <ButtonBase
            key={row.slot.id}
            onClick={() => handleSwap(row.slot.id)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '10px 12px',
              borderRadius: 'var(--radius-l)',
              border: '1px solid var(--accent-200)',
              textAlign: 'start',
              transition: `background-color 0.3s ${DUTY_EASE}`,
              '&:hover': { backgroundColor: 'var(--accent-150)' },
              '&:focus-visible': {
                outline: '2px solid var(--accent-350)',
                outlineOffset: '2px',
              },
            }}
          >
            <Typography className="label-small-regular" color="var(--grey-350)">
              {t(DUTY_MEETING_KEYS[row.slot.meeting])} · {label(row)}
            </Typography>
            <Typography className="body-regular">{personText(row)}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Dialog>
  );
};

export default DutySwapDialog;
