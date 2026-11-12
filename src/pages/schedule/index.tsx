import { Box } from '@mui/material';
import { IconImportFile, IconJwOrg } from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import {
  jwcCardSx,
  jwcPrimaryButtonSx,
  jwcSecondaryButtonSx,
  jwcType,
} from '@features/jwc/styles';
import useScheduleWorkspace from './useScheduleWorkspace';
import Button from '@components/button';
import JwcActionBar from '@features/jwc/workflow/action_bar';
import JwcAppNav from '@features/jwc/app_nav';
import JwcEyebrow from '@features/jwc/eyebrow';
import JwcMeetingTabs from '@features/jwc/meeting_tabs';
import JwcReviewPanel from '@features/jwc/review_panel';
import JwcSavedIndicator from '@features/jwc/saved_indicator';
import JwcWeekBar from '@features/jwc/week_bar';
import JwcWorkflowSteps from '@features/jwc/workflow/steps';
import LanguageGroupSelector from '@features/language_group_selector';
import MeetingDuties from '@pages/meetings/duties';
import MidweekEditor from '@features/meetings/midweek_editor';
import MidweekExport from '@features/meetings/midweek_export';
import MidweekMeetingView from '@features/meetings/weekly_schedules/midweek_meeting';
import OutgoingTalks from '@features/meetings/outgoing_talks';
import PageTitle from '@components/page_title';
import QuickSettingsMidweekMeeting from '@features/meetings/midweek_editor/quick_settings';
import QuickSettingsWeekendMeeting from '@features/meetings/weekend_editor/quick_settings';
import ScheduleAutofillDialog from '@features/meetings/schedule_autofill';
import SchedulePublish from '@features/meetings/schedule_publish';
import Typography from '@components/typography';
import WeekendEditor from '@features/meetings/weekend_editor';
import WeekendExport from '@features/meetings/weekend_export';
import WeekendMeetingView from '@features/meetings/weekly_schedules/weekend_meeting';

const ScheduleWorkspace = () => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const {
    tab,
    tabs,
    canEdit,
    mode,
    meeting,
    week,
    weeks,
    hasWeeks,
    isCurrentWeek,
    canGoBack,
    canGoNext,
    dutiesReady,
    dataView,
    progress,
    isConnected,
    isNavigatorOnline,
    handleTabChange,
    handlePrevWeek,
    handleNextWeek,
    handleThisWeek,
    handlePickWeek,
    handleEdit,
    handleReview,
    handleBackToView,
    handleOpenJWImport,
    handleOpenEPUBFile,
    openAutofill,
    setOpenAutofill,
    openExport,
    setOpenExport,
    openPublish,
    setOpenPublish,
    openSettings,
    setOpenSettings,
  } = useScheduleWorkspace();

  const showWorkflow = meeting !== null && canEdit && hasWeeks;
  const isEditing = showWorkflow && mode === 'edit';

  const renderMeetingView = () => {
    if (meeting === 'midweek') {
      return <MidweekMeetingView week={week} dataView={dataView} />;
    }

    return <WeekendMeetingView week={week} dataView={dataView} />;
  };

  const renderEditor = () => {
    if (meeting === 'midweek') return <MidweekEditor />;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <WeekendEditor />
        <OutgoingTalks />
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '1120px',
        marginInline: 'auto',
        paddingBottom: tablet688Up ? '32px' : showWorkflow ? '172px' : '100px',
      }}
    >
      <PageTitle />

      {/* header: compact on phones, so the schedule starts high on the screen */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: tablet688Up ? 'flex-end' : 'center',
          justifyContent: 'space-between',
          gap: tablet688Up ? '16px' : '8px 12px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tablet688Up && <JwcEyebrow text={t('tr_jwcAppName')} />}
          <Typography
            component="h1"
            sx={jwcType({
              fontSize: { mobile: '26px', tablet688: '40px' },
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--black)',
              ':lang(ml) &': { letterSpacing: 0, lineHeight: 1.35 },
            })}
          >
            {t('tr_jwcScheduleTitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageGroupSelector />
          {tablet688Up && <JwcAppNav />}
        </Box>
      </Box>

      {/* 1. select a week */}
      <JwcWeekBar
        week={week}
        firstWeek={weeks.at(0)}
        lastWeek={weeks.at(-1)}
        isCurrentWeek={isCurrentWeek}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        disabled={!hasWeeks}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onThisWeek={handleThisWeek}
        onPick={handlePickWeek}
      />

      {/* meeting tabs + workflow */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: tablet688Up ? '4px' : '14px',
        }}
      >
        {tabs.length > 1 && (
          <JwcMeetingTabs tabs={tabs} value={tab} onChange={handleTabChange} />
        )}

        {showWorkflow && tablet688Up && (
          <JwcActionBar
            mode={mode}
            canPublish={isConnected}
            isOnline={isNavigatorOnline}
            onEdit={handleEdit}
            onReview={handleReview}
            onBackToView={handleBackToView}
            onPublish={() => setOpenPublish(true)}
            onExport={() => setOpenExport(true)}
            onAutofill={() => setOpenAutofill(true)}
            onSettings={() => setOpenSettings(true)}
            onImportJW={handleOpenJWImport}
            onImportEPUB={handleOpenEPUBFile}
          />
        )}
      </Box>

      {showWorkflow && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px 16px',
          }}
        >
          <JwcWorkflowSteps mode={mode} />
          <JwcSavedIndicator
            week={week}
            meeting={meeting}
            dataView={dataView}
          />
        </Box>
      )}

      {/* panel */}
      <Box
        id="jwc-schedule-panel"
        role="tabpanel"
        aria-labelledby={`jwc-tab-${tab}`}
        key={`${tab}-${mode}`}
        className="jwc-rise"
        sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {meeting !== null && !hasWeeks && (
          <Box
            sx={{
              ...jwcCardSx,
              padding: { mobile: '22px', tablet688: '32px' },
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <Typography component="h2" className="h2">
              {t('tr_jwcNoWeeksTitle')}
            </Typography>
            <Typography className="body-regular" color="var(--grey-400)">
              {canEdit ? t('tr_jwcNoWeeksEditor') : t('tr_jwcNoWeeksViewer')}
            </Typography>
            {canEdit && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isNavigatorOnline && (
                  <Button
                    variant="main"
                    startIcon={<IconJwOrg />}
                    onClick={handleOpenJWImport}
                    sx={jwcPrimaryButtonSx}
                  >
                    {t('tr_sourceImportJw')}
                  </Button>
                )}
                <Button
                  variant="tertiary"
                  startIcon={<IconImportFile />}
                  onClick={handleOpenEPUBFile}
                  sx={jwcSecondaryButtonSx}
                >
                  {t('tr_sourceImportEPUB')}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {meeting !== null && hasWeeks && week && (
          <>
            {!canEdit && (
              <Typography
                className="body-small-regular"
                color="var(--grey-400)"
              >
                {t('tr_jwcReadOnly')}
              </Typography>
            )}

            {showWorkflow && mode === 'review' && (
              <JwcReviewPanel
                assigned={progress.assigned}
                total={progress.total}
                canPublish={isConnected}
                onKeepEditing={handleEdit}
              />
            )}

            {isEditing ? (
              <Box
                data-testid="jwc-editor"
                sx={{
                  '& > *': { borderRadius: 'var(--radius-xxl) !important' },
                }}
              >
                {renderEditor()}
              </Box>
            ) : (
              <Box
                data-testid="jwc-schedule-view"
                sx={{
                  ...jwcCardSx,
                  padding: { mobile: '16px', tablet688: '24px' },
                }}
              >
                {renderMeetingView()}
              </Box>
            )}
          </>
        )}

        {tab === 'duties' && dutiesReady && <MeetingDuties embedded />}
      </Box>

      {showWorkflow && !tablet688Up && (
        <JwcActionBar
          mode={mode}
          canPublish={isConnected}
          isOnline={isNavigatorOnline}
          onEdit={handleEdit}
          onReview={handleReview}
          onBackToView={handleBackToView}
          onPublish={() => setOpenPublish(true)}
          onExport={() => setOpenExport(true)}
          onAutofill={() => setOpenAutofill(true)}
          onSettings={() => setOpenSettings(true)}
          onImportJW={handleOpenJWImport}
          onImportEPUB={handleOpenEPUBFile}
        />
      )}

      {!tablet688Up && <JwcAppNav />}

      {/* existing Organized dialogs */}
      {meeting && openAutofill && (
        <ScheduleAutofillDialog
          meeting={meeting}
          open={openAutofill}
          onClose={() => setOpenAutofill(false)}
        />
      )}

      {meeting === 'midweek' && openExport && (
        <MidweekExport open={openExport} onClose={() => setOpenExport(false)} />
      )}

      {meeting === 'weekend' && openExport && (
        <WeekendExport open={openExport} onClose={() => setOpenExport(false)} />
      )}

      {meeting && isConnected && openPublish && (
        <SchedulePublish
          type={meeting}
          open={openPublish}
          onClose={() => setOpenPublish(false)}
        />
      )}

      {meeting === 'midweek' && openSettings && (
        <QuickSettingsMidweekMeeting
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        />
      )}

      {meeting === 'weekend' && openSettings && (
        <QuickSettingsWeekendMeeting
          open={openSettings}
          onClose={() => setOpenSettings(false)}
        />
      )}
    </Box>
  );
};

export default ScheduleWorkspace;
