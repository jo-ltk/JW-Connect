import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAppTranslation } from '@hooks/index';
import { personsState } from '@states/persons';
import { dutyHistoryDbState, dutyTypesDbState } from '@states/duties';
import { DutyHistoryStatus } from '@definition/duties';
import { BadgeColor } from '@definition/app';
import { dutyPersonName } from '@services/app/duties';
import { dateFormatFriendly } from '@utils/date';
import { DutyThemeVars, dutyDialogPaper } from '../duties_theme';
import { DUTY_MEETING_KEYS } from '../constants';
import Badge from '@components/badge';
import Button from '@components/button';
import Dialog from '@components/dialog';
import MenuItem from '@components/menuitem';
import Select from '@components/select';
import SwitchWithLabel from '@components/switch_with_label';
import Typography from '@components/typography';

const STATUS: Record<DutyHistoryStatus, { key: string; color: BadgeColor }> = {
  active: { key: 'tr_dutyHistoryActive', color: 'green' },
  replaced: { key: 'tr_dutyHistoryReplaced', color: 'grey' },
  removed: { key: 'tr_dutyHistoryRemoved', color: 'grey' },
};

const PAGE_SIZE = 100;

type DutyHistoryDialogProps = {
  themeVars: DutyThemeVars;
  open: boolean;
  onClose: VoidFunction;
};

const DutyHistoryDialog = ({
  themeVars,
  open,
  onClose,
}: DutyHistoryDialogProps) => {
  const { t } = useAppTranslation();

  const history = useAtomValue(dutyHistoryDbState);
  const duties = useAtomValue(dutyTypesDbState);
  const persons = useAtomValue(personsState);

  const [person, setPerson] = useState('all');
  const [duty, setDuty] = useState('all');
  const [showChanges, setShowChanges] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const names = useMemo(
    () =>
      new Map(
        persons.map((record) => [record.person_uid, dutyPersonName(record)])
      ),
    [persons]
  );

  const dutyNames = useMemo(
    () =>
      new Map(duties.map((record) => [record.duty_uid, record.duty_data.name])),
    [duties]
  );

  const peopleInHistory = useMemo(
    () =>
      Array.from(new Set(history.map((record) => record.person_uid)))
        .map((uid) => ({ uid, name: names.get(uid) ?? '' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [history, names]
  );

  const records = useMemo(
    () =>
      history
        .filter((record) => showChanges || record.status === 'active')
        .filter((record) => person === 'all' || record.person_uid === person)
        .filter((record) => duty === 'all' || record.duty_uid === duty)
        .sort((a, b) => {
          if (a.meeting_date !== b.meeting_date) {
            return b.meeting_date.localeCompare(a.meeting_date);
          }
          return b.created_at.localeCompare(a.created_at);
        }),
    [history, showChanges, person, duty]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closable
      title={t('tr_dutyHistory')}
      description={t('tr_dutyHistoryDesc')}
      PaperProps={dutyDialogPaper(themeVars, 720)}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%',
        }}
      >
        <Box sx={{ flex: '1 1 200px' }}>
          <Select
            label={t('tr_dutyFilterPerson')}
            value={person}
            onChange={(e) => setPerson(e.target.value as string)}
          >
            <MenuItem value="all">{t('tr_dutyAllPeople')}</MenuItem>
            {peopleInHistory.map((record) => (
              <MenuItem key={record.uid} value={record.uid}>
                {record.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ flex: '1 1 200px' }}>
          <Select
            label={t('tr_dutyFilterPosition')}
            value={duty}
            onChange={(e) => setDuty(e.target.value as string)}
          >
            <MenuItem value="all">{t('tr_dutyAllPositions')}</MenuItem>
            {duties
              .filter((record) => !record.duty_data._deleted)
              .map((record) => (
                <MenuItem key={record.duty_uid} value={record.duty_uid}>
                  {record.duty_data.name}
                </MenuItem>
              ))}
          </Select>
        </Box>
      </Box>

      <SwitchWithLabel
        label={t('tr_dutyHistoryShowChanges')}
        checked={showChanges}
        onChange={setShowChanges}
      />

      <Typography className="body-small-regular" color="var(--grey-400)">
        {t('tr_dutyHistoryCount', { count: records.length })}
      </Typography>

      {records.length === 0 && (
        <Typography className="body-regular" color="var(--grey-400)">
          {t('tr_dutyHistoryEmpty')}
        </Typography>
      )}

      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          width: '100%',
        }}
      >
        {records.slice(0, limit).map((record) => (
          <Box
            component="li"
            key={record.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, auto) 1fr auto',
              alignItems: 'center',
              gap: '4px 12px',
              padding: '10px 0',
              borderBottom: '1px solid var(--accent-200)',
              opacity: record.status === 'active' ? 1 : 0.65,
            }}
          >
            <Box>
              <Typography className="body-small-semibold">
                {dateFormatFriendly(record.meeting_date)}
              </Typography>
              <Typography
                className="label-small-regular"
                color="var(--grey-350)"
              >
                {t(DUTY_MEETING_KEYS[record.meeting])}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="body-regular">
                {names.get(record.person_uid) ?? ''}
              </Typography>
              <Typography
                className="label-small-regular"
                color="var(--grey-350)"
              >
                {dutyNames.get(record.duty_uid) ?? record.duty_name}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'flex-end',
              }}
            >
              <Badge
                size="small"
                color="accent"
                filled={false}
                text={
                  record.source === 'manual'
                    ? t('tr_dutySourceManual')
                    : t('tr_dutySourceAuto')
                }
              />
              {showChanges && (
                <Badge
                  size="small"
                  color={STATUS[record.status].color}
                  filled={false}
                  text={t(STATUS[record.status].key)}
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {records.length > limit && (
        <Button
          variant="tertiary"
          onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
        >
          {t('tr_dutyShowMore')}
        </Button>
      )}
    </Dialog>
  );
};

export default DutyHistoryDialog;
