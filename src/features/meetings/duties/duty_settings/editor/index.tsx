import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAppTranslation } from '@hooks/index';
import { personsActiveState } from '@states/persons';
import { DutyMeetingOption, DutyType } from '@definition/duties';
import {
  DUTY_MAX_REQUIRED,
  dutyDelete,
  dutyPersonName,
  dutySave,
  dutySuggestedEligible,
} from '@services/app/duties';
import { DutyThemeVars, dutyDialogPaper } from '../../duties_theme';
import { DUTY_MEETING_OPTION_KEYS } from '../../constants';
import Button from '@components/button';
import Checkbox from '@components/checkbox';
import Dialog from '@components/dialog';
import MenuItem from '@components/menuitem';
import SearchBar from '@components/search_bar';
import Select from '@components/select';
import SwitchWithLabel from '@components/switch_with_label';
import TextField from '@components/textfield';
import Typography from '@components/typography';

type DutyEditorProps = {
  themeVars: DutyThemeVars;
  duty: DutyType;
  isNew: boolean;
  onClose: VoidFunction;
  onError: (error: unknown) => void;
};

const MEETING_OPTIONS: DutyMeetingOption[] = ['both', 'midweek', 'weekend'];

const DutyEditor = ({
  themeVars,
  duty,
  isNew,
  onClose,
  onError,
}: DutyEditorProps) => {
  const { t } = useAppTranslation();

  const persons = useAtomValue(personsActiveState);

  const [data, setData] = useState(duty.duty_data);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameError, setNameError] = useState(false);

  const people = useMemo(
    () =>
      persons
        .filter((person) => !person.person_data.disqualified?.value)
        .map((person) => ({
          person_uid: person.person_uid,
          name: dutyPersonName(person),
        })),
    [persons]
  );

  const filtered = people.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase())
  );

  const update = (patch: Partial<DutyType['duty_data']>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const toggleEligible = (person_uid: string, checked: boolean) =>
    update({
      eligible: checked
        ? [...data.eligible, person_uid]
        : data.eligible.filter((uid) => uid !== person_uid),
    });

  const handleSuggest = () => {
    const suggested = dutySuggestedEligible();
    update({
      eligible: Array.from(new Set([...data.eligible, ...suggested])),
    });
  };

  const handleSave = async () => {
    if (data.name.trim().length === 0) {
      setNameError(true);
      return;
    }

    try {
      await dutySave({ ...duty, duty_data: data });
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  const handleDelete = async () => {
    try {
      await dutyDelete(duty);
      onClose();
    } catch (error) {
      onError(error);
    }
  };

  if (confirmDelete) {
    return (
      <Dialog
        open
        onClose={() => setConfirmDelete(false)}
        title={t('tr_dutyDeleteTitle', { duty: data.name })}
        description={t('tr_dutyDeleteDesc')}
        PaperProps={dutyDialogPaper(themeVars, 480)}
        actions={
          <Box sx={{ display: 'flex', gap: '8px', width: '100%' }}>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              sx={{ flex: 1 }}
            >
              {t('tr_cancel')}
            </Button>
            <Button
              variant="main"
              color="red"
              onClick={handleDelete}
              sx={{ flex: 1 }}
            >
              {t('tr_delete')}
            </Button>
          </Box>
        }
      />
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      closable
      title={isNew ? t('tr_dutyAddPosition') : t('tr_dutyEditPosition')}
      PaperProps={dutyDialogPaper(themeVars, 640)}
      actions={
        <Box sx={{ display: 'flex', gap: '8px', width: '100%' }}>
          {!isNew && (
            <Button
              variant="secondary"
              color="red"
              onClick={() => setConfirmDelete(true)}
              sx={{ flex: 1 }}
            >
              {t('tr_delete')}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} sx={{ flex: 1 }}>
            {t('tr_cancel')}
          </Button>
          <Button variant="main" onClick={handleSave} sx={{ flex: 1 }}>
            {t('tr_save')}
          </Button>
        </Box>
      }
    >
      <TextField
        label={t('tr_dutyName')}
        value={data.name}
        error={nameError}
        helperText={nameError ? t('tr_dutyErrorNameRequired') : undefined}
        onChange={(e) => {
          setNameError(false);
          update({ name: e.target.value });
        }}
        sx={{ width: '100%' }}
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
        }}
      >
        <Box sx={{ flex: '1 1 200px' }}>
          <Select
            label={t('tr_dutyMeetingType')}
            value={data.meeting}
            onChange={(e) =>
              update({ meeting: e.target.value as DutyMeetingOption })
            }
          >
            {MEETING_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(DUTY_MEETING_OPTION_KEYS[option])}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ flex: '1 1 160px' }}>
          <TextField
            type="number"
            label={t('tr_dutyRequiredPeople')}
            value={data.required}
            slotProps={{
              htmlInput: { min: 1, max: DUTY_MAX_REQUIRED, step: 1 },
            }}
            onChange={(e) => update({ required: Number(e.target.value) })}
            sx={{ width: '100%' }}
          />
        </Box>
      </Box>

      <SwitchWithLabel
        label={t('tr_dutyActive')}
        checked={data.active}
        onChange={(active) => update({ active })}
      />

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <Box>
            <Typography className="h4">{t('tr_dutyEligiblePeople')}</Typography>
            <Typography className="body-small-regular" color="var(--grey-400)">
              {t('tr_dutyEligibleCount', { count: data.eligible.length })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="small" onClick={handleSuggest}>
              {t('tr_dutyAddBaptizedBrothers')}
            </Button>
            <Button variant="small" onClick={() => update({ eligible: [] })}>
              {t('tr_dutyClearEligible')}
            </Button>
          </Box>
        </Box>

        {people.length > 6 && (
          <SearchBar
            placeholder={t('tr_search')}
            value={search}
            onSearch={setSearch}
          />
        )}

        {people.length === 0 && (
          <Typography className="body-regular" color="var(--grey-400)">
            {t('tr_dutyNoPersons')}
          </Typography>
        )}

        <Box
          role="group"
          aria-label={t('tr_dutyEligiblePeople')}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '4px 12px',
          }}
        >
          {filtered.map((person) => (
            <Checkbox
              key={person.person_uid}
              label={person.name}
              checked={data.eligible.includes(person.person_uid)}
              onChange={(_, checked) =>
                toggleEligible(person.person_uid, checked)
              }
            />
          ))}
        </Box>
      </Box>
    </Dialog>
  );
};

export default DutyEditor;
