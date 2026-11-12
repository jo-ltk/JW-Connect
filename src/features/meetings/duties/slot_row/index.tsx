import { Box, ButtonBase } from '@mui/material';
import {
  IconLock,
  IconPerson,
  IconRemovePerson,
  IconReorder,
} from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { DutyRowView } from '../useDutyWeek';
import { DUTY_EASE } from '../duties_theme';
import { DUTY_WARNING_KEYS } from '../constants';
import Badge from '@components/badge';
import ButtonIcon from '@components/icon_button';
import Tooltip from '@components/tooltip';
import Typography from '@components/typography';

type DutySlotRowProps = {
  row: DutyRowView;
  onAssign: (slot_id: string) => void;
  onSwap: (slot_id: string) => void;
  onRemove: (slot_id: string) => void;
  onToggleLock: (slot_id: string) => void;
};

const DutySlotRow = ({
  row,
  onAssign,
  onSwap,
  onRemove,
  onToggleLock,
}: DutySlotRowProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const { slot, duty, personName, warnings } = row;
  const assigned = slot.person_uid.length > 0;

  const positionLabel =
    duty.duty_data.required > 1
      ? `${duty.duty_data.name} ${slot.index + 1}`
      : duty.duty_data.name;

  const lockLabel = slot.locked ? t('tr_dutyUnlock') : t('tr_dutyLock');

  return (
    <Box
      role="row"
      sx={{
        display: 'grid',
        gridTemplateColumns: tablet688Up
          ? 'minmax(140px, 1fr) minmax(180px, 1.4fr) auto'
          : '1fr auto',
        gridTemplateAreas: tablet688Up
          ? '"duty person actions"'
          : '"duty actions" "person person"',
        alignItems: 'center',
        gap: tablet688Up ? '16px' : '8px 12px',
        padding: tablet688Up ? '12px 24px' : '12px 16px',
        borderTop: '1px solid var(--accent-200)',
        backgroundColor: slot.locked ? 'var(--accent-100)' : 'transparent',
        transition: `background-color 0.3s ${DUTY_EASE}`,
      }}
    >
      <Box role="rowheader" sx={{ gridArea: 'duty', minWidth: 0 }}>
        <Typography className="h4" sx={{ overflowWrap: 'anywhere' }}>
          {positionLabel}
        </Typography>
      </Box>

      <Box
        role="cell"
        sx={{
          gridArea: 'person',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: 0,
        }}
      >
        <ButtonBase
          onClick={() => onAssign(slot.id)}
          disabled={slot.locked}
          aria-label={
            assigned
              ? t('tr_dutyChangePersonFor', { duty: positionLabel })
              : t('tr_dutyAssignPersonFor', { duty: positionLabel })
          }
          sx={{
            justifyContent: 'flex-start',
            gap: '8px',
            padding: '8px 12px',
            minHeight: '44px',
            width: '100%',
            borderRadius: 'var(--radius-l)',
            border: assigned
              ? '1px solid var(--accent-200)'
              : '1px dashed var(--accent-350)',
            backgroundColor: assigned ? 'var(--white)' : 'var(--accent-100)',
            transition: `border-color 0.3s ${DUTY_EASE}, background-color 0.3s ${DUTY_EASE}`,
            '&:hover': {
              borderColor: 'var(--accent-main)',
              backgroundColor: 'var(--accent-150)',
            },
            '&:focus-visible': {
              outline: '2px solid var(--accent-350)',
              outlineOffset: '2px',
            },
            '&.Mui-disabled': { cursor: 'default' },
          }}
        >
          <IconPerson
            color={assigned ? 'var(--accent-main)' : 'var(--accent-350)'}
          />
          <Typography
            className={assigned ? 'body-regular' : 'body-small-regular'}
            color={assigned ? 'var(--black)' : 'var(--accent-400)'}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {assigned ? personName : t('tr_dutyNotAssigned')}
          </Typography>
        </ButtonBase>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {!assigned && (
            <Badge
              size="small"
              color="orange"
              text={t('tr_dutyStatusEmpty')}
              filled={false}
            />
          )}
          {assigned && (
            <Badge
              size="small"
              color="accent"
              text={
                slot.source === 'manual'
                  ? t('tr_dutySourceManual')
                  : t('tr_dutySourceAuto')
              }
              filled={false}
            />
          )}
          {slot.locked && (
            <Badge
              size="small"
              color="grey"
              text={t('tr_dutyLocked')}
              icon={<IconLock width={14} height={14} />}
              filled={false}
            />
          )}
          {warnings.map((reason) => (
            <Badge
              key={reason}
              size="small"
              color="red"
              text={t(DUTY_WARNING_KEYS[reason])}
              filled={false}
            />
          ))}
        </Box>
      </Box>

      <Box
        role="cell"
        sx={{
          gridArea: 'actions',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '2px',
        }}
      >
        <Tooltip title={lockLabel}>
          <ButtonIcon
            aria-label={lockLabel}
            aria-pressed={slot.locked}
            onClick={() => onToggleLock(slot.id)}
          >
            <IconLock
              color={slot.locked ? 'var(--accent-main)' : 'var(--grey-300)'}
            />
          </ButtonIcon>
        </Tooltip>

        <Tooltip title={t('tr_dutySwap')}>
          <span>
            <ButtonIcon
              aria-label={t('tr_dutySwap')}
              disabled={slot.locked}
              onClick={() => onSwap(slot.id)}
            >
              <IconReorder
                color={slot.locked ? 'var(--grey-200)' : 'var(--accent-main)'}
              />
            </ButtonIcon>
          </span>
        </Tooltip>

        <Tooltip title={t('tr_remove')}>
          <span>
            <ButtonIcon
              aria-label={t('tr_dutyRemoveAssignment')}
              disabled={slot.locked || !assigned}
              onClick={() => onRemove(slot.id)}
            >
              <IconRemovePerson
                color={
                  slot.locked || !assigned
                    ? 'var(--grey-200)'
                    : 'var(--red-main)'
                }
              />
            </ButtonIcon>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DutySlotRow;
