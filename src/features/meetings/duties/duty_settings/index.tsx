import { useState } from 'react';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { IconAdd, IconArrowDown, IconEdit } from '@components/icons';
import { useAppTranslation } from '@hooks/index';
import { dutyTypesState } from '@states/duties';
import { DutyType } from '@definition/duties';
import { dutyCreateEmpty, dutyMove, dutySave } from '@services/app/duties';
import { DutyThemeVars, dutyDialogPaper } from '../duties_theme';
import { DUTY_MEETING_OPTION_KEYS } from '../constants';
import Button from '@components/button';
import ButtonIcon from '@components/icon_button';
import Dialog from '@components/dialog';
import Switch from '@components/switch';
import Typography from '@components/typography';
import DutyEditor from './editor';

type DutySettingsProps = {
  themeVars: DutyThemeVars;
  open: boolean;
  onClose: VoidFunction;
  onError: (error: unknown) => void;
};

const DutySettings = ({
  themeVars,
  open,
  onClose,
  onError,
}: DutySettingsProps) => {
  const { t } = useAppTranslation();

  const duties = useAtomValue(dutyTypesState);

  const [editing, setEditing] = useState<{
    duty: DutyType;
    isNew: boolean;
  } | null>(null);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      onError(error);
    }
  };

  const handleToggleActive = (duty: DutyType, active: boolean) =>
    run(() => dutySave({ ...duty, duty_data: { ...duty.duty_data, active } }));

  return (
    <>
      <Dialog
        open={open && !editing}
        onClose={onClose}
        closable
        title={t('tr_dutyPositions')}
        description={t('tr_dutyPositionsDesc')}
        PaperProps={dutyDialogPaper(themeVars, 640)}
        actions={
          <Button
            variant="main"
            startIcon={<IconAdd />}
            onClick={() => setEditing({ duty: dutyCreateEmpty(), isNew: true })}
            sx={{ width: '100%' }}
          >
            {t('tr_dutyAddPosition')}
          </Button>
        }
      >
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {duties.map((duty, index) => (
            <Box
              component="li"
              key={duty.duty_uid}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 8px 8px 16px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--accent-200)',
                backgroundColor: duty.duty_data.active
                  ? 'var(--white)'
                  : 'var(--grey-100)',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  className="h4"
                  color={
                    duty.duty_data.active ? 'var(--black)' : 'var(--grey-350)'
                  }
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {duty.duty_data.name}
                </Typography>
                <Typography
                  className="label-small-regular"
                  color="var(--grey-350)"
                >
                  {t(DUTY_MEETING_OPTION_KEYS[duty.duty_data.meeting])} ·{' '}
                  {t('tr_dutyPeopleNeeded', {
                    count: duty.duty_data.required,
                  })}{' '}
                  ·{' '}
                  {t('tr_dutyEligibleCount', {
                    count: duty.duty_data.eligible.length,
                  })}
                </Typography>
              </Box>

              <Switch
                checked={duty.duty_data.active}
                slotProps={{
                  input: {
                    'aria-label': t('tr_dutyActiveFor', {
                      duty: duty.duty_data.name,
                    }),
                  },
                }}
                onChange={(_, checked) => handleToggleActive(duty, checked)}
              />

              <ButtonIcon
                aria-label={t('tr_dutyMoveUp')}
                disabled={index === 0}
                onClick={() => run(() => dutyMove(duty.duty_uid, -1))}
              >
                <IconArrowDown
                  color={index === 0 ? 'var(--grey-200)' : 'var(--accent-main)'}
                  sx={{ transform: 'rotate(180deg)' }}
                />
              </ButtonIcon>

              <ButtonIcon
                aria-label={t('tr_dutyMoveDown')}
                disabled={index === duties.length - 1}
                onClick={() => run(() => dutyMove(duty.duty_uid, 1))}
              >
                <IconArrowDown
                  color={
                    index === duties.length - 1
                      ? 'var(--grey-200)'
                      : 'var(--accent-main)'
                  }
                />
              </ButtonIcon>

              <ButtonIcon
                aria-label={t('tr_edit')}
                onClick={() => setEditing({ duty, isNew: false })}
              >
                <IconEdit color="var(--accent-main)" />
              </ButtonIcon>
            </Box>
          ))}
        </Box>
      </Dialog>

      {editing && (
        <DutyEditor
          themeVars={themeVars}
          duty={editing.duty}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onError={onError}
        />
      )}
    </>
  );
};

export default DutySettings;
