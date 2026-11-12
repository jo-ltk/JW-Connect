import { useMemo, useState } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { useAppTranslation } from '@hooks/index';
import { DutyWarningReason } from '@definition/duties';
import {
  dutyAssignPerson,
  dutyCheckPersonForSlot,
  dutyRemovePerson,
} from '@services/app/duties';
import { DUTY_EASE, DutyThemeVars, dutyDialogPaper } from '../duties_theme';
import { DUTY_MEETING_KEYS, DUTY_WARNING_KEYS } from '../constants';
import useDutyWeek from '../useDutyWeek';
import Badge from '@components/badge';
import Button from '@components/button';
import Dialog from '@components/dialog';
import SearchBar from '@components/search_bar';
import Typography from '@components/typography';

type DutyAssignDialogProps = {
  themeVars: DutyThemeVars;
  weekOf: string;
  slotId: string;
  week: ReturnType<typeof useDutyWeek>;
  onClose: VoidFunction;
  onError: (error: unknown) => void;
};

type Option = {
  person_uid: string;
  name: string;
  lastServed: number;
  problems: DutyWarningReason[];
};

const DutyAssignDialog = ({
  themeVars,
  weekOf,
  slotId,
  week,
  onClose,
  onError,
}: DutyAssignDialogProps) => {
  const { t } = useAppTranslation();

  const [search, setSearch] = useState('');

  const row = week.rows.find((item) => item.slot.id === slotId);

  const options = useMemo<Option[]>(() => {
    if (!row) return [];

    return row.duty.duty_data.eligible
      .filter((uid) => week.personNames.has(uid))
      .map((person_uid) => ({
        person_uid,
        name: week.personNames.get(person_uid) ?? '',
        lastServed: week.lastServed(person_uid, row.duty.duty_uid),
        problems:
          person_uid === row.slot.person_uid
            ? []
            : dutyCheckPersonForSlot(weekOf, slotId, person_uid),
      }))
      .sort((a, b) => {
        if ((a.problems.length === 0) !== (b.problems.length === 0)) {
          return a.problems.length === 0 ? -1 : 1;
        }
        if (a.lastServed !== b.lastServed) return b.lastServed - a.lastServed;
        return a.name.localeCompare(b.name);
      });
  }, [row, week, weekOf, slotId]);

  if (!row) return null;

  const filtered = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (person_uid: string) => {
    try {
      if (person_uid !== row.slot.person_uid) {
        await dutyAssignPerson(weekOf, slotId, person_uid);
      }
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  const handleRemove = async () => {
    try {
      await dutyRemovePerson(weekOf, slotId);
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  const positionLabel =
    row.duty.duty_data.required > 1
      ? `${row.duty.duty_data.name} ${row.slot.index + 1}`
      : row.duty.duty_data.name;

  const lastServedText = (weeks: number) => {
    if (weeks === Infinity) return t('tr_dutyNeverHadDuty');
    if (weeks === 0) return t('tr_dutyThisWeekShort');
    return t('tr_dutyWeeksAgo', { count: weeks });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      closable
      title={positionLabel}
      description={t(DUTY_MEETING_KEYS[row.slot.meeting])}
      PaperProps={dutyDialogPaper(themeVars)}
      actions={
        <Box sx={{ display: 'flex', gap: '8px', width: '100%' }}>
          {row.slot.person_uid && (
            <Button
              variant="secondary"
              color="red"
              onClick={handleRemove}
              sx={{ flex: 1 }}
            >
              {t('tr_dutyRemoveAssignment')}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} sx={{ flex: 1 }}>
            {t('tr_cancel')}
          </Button>
        </Box>
      }
    >
      {options.length === 0 && (
        <Typography className="body-regular" color="var(--grey-400)">
          {t('tr_dutyNoEligiblePeople')}
        </Typography>
      )}

      {options.length > 6 && (
        <Box sx={{ width: '100%' }}>
          <SearchBar
            placeholder={t('tr_search')}
            value={search}
            onSearch={setSearch}
          />
        </Box>
      )}

      <Box
        role="listbox"
        aria-label={t('tr_dutyEligiblePeople')}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {filtered.map((option) => {
          const current = option.person_uid === row.slot.person_uid;
          const disabled = option.problems.length > 0;

          return (
            <ButtonBase
              key={option.person_uid}
              role="option"
              aria-selected={current}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => handleSelect(option.person_uid)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-l)',
                border: current
                  ? '1px solid var(--accent-main)'
                  : '1px solid var(--accent-200)',
                backgroundColor: current ? 'var(--accent-150)' : 'var(--white)',
                textAlign: 'start',
                transition: `background-color 0.3s ${DUTY_EASE}`,
                '&:hover': { backgroundColor: 'var(--accent-150)' },
                '&:focus-visible': {
                  outline: '2px solid var(--accent-350)',
                  outlineOffset: '2px',
                },
                '&.Mui-disabled': { opacity: 0.6 },
              }}
            >
              <Box
                sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
              >
                <Typography className="body-regular">{option.name}</Typography>
                <Typography
                  className="label-small-regular"
                  color="var(--grey-350)"
                >
                  {lastServedText(option.lastServed)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {current && (
                  <Badge
                    size="small"
                    color="accent"
                    text={t('tr_dutyCurrent')}
                    filled
                  />
                )}
                {option.problems.map((reason) => (
                  <Badge
                    key={reason}
                    size="small"
                    color="grey"
                    text={t(DUTY_WARNING_KEYS[reason])}
                    filled={false}
                  />
                ))}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Dialog>
  );
};

export default DutyAssignDialog;
