import { Box } from '@mui/material';
import {
  IconGenerate,
  IconHistory,
  IconPublish,
  IconSettings,
  IconUndo,
} from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { dutiesThemeVars } from '@features/meetings/duties/duties_theme';
import { jwcPrimaryButtonSx, jwcSecondaryButtonSx } from '@features/jwc/styles';
import PageTitle from '@components/page_title';
import NavBarButton from '@components/nav_bar_button';
import NavBarButtonGroup from '@components/nav_bar_button_group';
import Button from '@components/button';
import useMeetingDuties from './useMeetingDuties';
import DutyWeekBar from '@features/meetings/duties/week_bar';
import DutyRoster from '@features/meetings/duties/roster';
import DutyShortages from '@features/meetings/duties/shortages';
import DutyAssignDialog from '@features/meetings/duties/assign_dialog';
import DutySwapDialog from '@features/meetings/duties/swap_dialog';
import DutySettings from '@features/meetings/duties/duty_settings';
import DutyHistoryDialog from '@features/meetings/duties/history_dialog';
import ExportDuties from '@features/meetings/duties/export_duties';

type MeetingDutiesProps = {
  /**
   * Shown inside the JW Connect schedule workspace: the workspace owns the
   * page title, the week selection and the theme.
   */
  embedded?: boolean;
};

const MeetingDuties = ({ embedded = false }: MeetingDutiesProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const {
    weekOf,
    isDark,
    week,
    shortages,
    isGenerating,
    handlePrevWeek,
    handleNextWeek,
    handleThisWeek,
    handleWeekChange,
    handleGenerate,
    handleToggleLock,
    handleRemove,
    handlePublish,
    handleUnpublish,
    showError,
    assignSlot,
    setAssignSlot,
    swapSlot,
    setSwapSlot,
    settingsOpen,
    setSettingsOpen,
    historyOpen,
    setHistoryOpen,
  } = useMeetingDuties();

  const themeVars = dutiesThemeVars(isDark);

  const hasAssignments = week.filled > 0;

  // only shortages whose position is still empty
  const openShortages = shortages.filter((shortage) =>
    week.rows.some(
      (row) => row.slot.id === shortage.slot_id && !row.slot.person_uid
    )
  );

  const pageButtonList = (
    <>
      <NavBarButton
        text={t('tr_dutyPositions')}
        icon={<IconSettings />}
        onClick={() => setSettingsOpen(true)}
        textImportant={embedded}
      />
      <NavBarButton
        text={t('tr_dutyHistory')}
        icon={<IconHistory />}
        onClick={() => setHistoryOpen(true)}
        textImportant={embedded}
      />
      <ExportDuties
        weekOf={weekOf}
        disabled={!hasAssignments}
        textImportant={embedded}
      />
    </>
  );

  // inside the JW Connect workspace: MEPTOR pill buttons (jwc.css tokens)
  const primarySx = embedded ? jwcPrimaryButtonSx : undefined;
  const secondarySx = embedded ? jwcSecondaryButtonSx : undefined;

  return (
    <Box
      sx={{
        ...(embedded ? {} : themeVars),
        display: 'flex',
        gap: '16px',
        flexDirection: 'column',
        paddingBottom: !tablet688Up && !embedded ? '60px' : '0px',
      }}
    >
      {embedded ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            '& .MuiButton-root': { width: 'auto' },
          }}
        >
          {pageButtonList}
        </Box>
      ) : (
        <PageTitle
          title={t('tr_meetingDuties')}
          buttons={<NavBarButtonGroup>{pageButtonList}</NavBarButtonGroup>}
        />
      )}

      {weekOf && (
        <DutyWeekBar
          hideNavigation={embedded}
          weekOf={weekOf}
          status={week.status}
          filled={week.filled}
          total={week.total}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
          onToday={handleThisWeek}
          onPick={handleWeekChange}
          actions={
            <>
              <Button
                variant="main"
                startIcon={<IconGenerate />}
                onClick={handleGenerate}
                disabled={isGenerating || week.total === 0}
                sx={primarySx}
              >
                {hasAssignments ? t('tr_dutyRegenerate') : t('tr_dutyGenerate')}
              </Button>

              {week.status === 'draft' && hasAssignments && (
                <Button
                  variant="secondary"
                  startIcon={<IconPublish />}
                  onClick={handlePublish}
                  sx={secondarySx}
                >
                  {t('tr_dutyMarkPublished')}
                </Button>
              )}

              {week.status === 'published' && (
                <Button
                  variant="tertiary"
                  startIcon={<IconUndo />}
                  onClick={handleUnpublish}
                  sx={secondarySx}
                >
                  {t('tr_dutyBackToDraft')}
                </Button>
              )}
            </>
          }
        />
      )}

      <DutyShortages shortages={openShortages} rows={week.rows} />

      <DutyRoster
        meetings={week.meetings}
        onAssign={setAssignSlot}
        onSwap={setSwapSlot}
        onRemove={handleRemove}
        onToggleLock={handleToggleLock}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {assignSlot && (
        <DutyAssignDialog
          themeVars={themeVars}
          weekOf={weekOf}
          slotId={assignSlot}
          week={week}
          onClose={() => setAssignSlot(null)}
          onError={showError}
        />
      )}

      {swapSlot && (
        <DutySwapDialog
          themeVars={themeVars}
          weekOf={weekOf}
          slotId={swapSlot}
          week={week}
          onClose={() => setSwapSlot(null)}
          onError={showError}
        />
      )}

      {settingsOpen && (
        <DutySettings
          themeVars={themeVars}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onError={showError}
        />
      )}

      {historyOpen && (
        <DutyHistoryDialog
          themeVars={themeVars}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </Box>
  );
};

export default MeetingDuties;
