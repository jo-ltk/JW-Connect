import { Box } from '@mui/material';
import {
  IconCheckCircle,
  IconInformationBoard,
  IconMinistryReport,
  IconPublishers,
} from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import {
  jwcCardSx,
  jwcPrimaryButtonSx,
  jwcSecondaryButtonSx,
  jwcType,
} from '@features/jwc/styles';
import useHome from './useHome';
import Button from '@components/button';
import JwcAppNav from '@features/jwc/app_nav';
import JwcArrowChip from '@features/jwc/arrow_chip';
import JwcEyebrow from '@features/jwc/eyebrow';
import JwcWeekPreview from '@features/jwc/week_preview';
import PageTitle from '@components/page_title';
import Snackbar from '@components/snackbar';
import Typography from '@components/typography';

const COMING_SOON = [
  { key: 'tr_jwcSoonReports', Icon: IconMinistryReport },
  { key: 'tr_jwcSoonPublishers', Icon: IconPublishers },
  { key: 'tr_jwcSoonNotices', Icon: IconInformationBoard },
];

const Home = () => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const {
    weekLabel,
    showMeetingCard,
    countFutureAssignments,
    handleOpenMyAssignments,
    handleOpenSchedule,
    newCongSnack,
    handleCloseNewCongNotice,
  } = useHome();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { mobile: '28px', tablet688: '40px' },
        maxWidth: '1120px',
        marginInline: 'auto',
        paddingBottom: tablet688Up ? '24px' : '96px',
      }}
    >
      <PageTitle />

      {tablet688Up && <JwcAppNav />}

      {/* hero */}
      <Box
        component="section"
        aria-labelledby="jwc-home-title"
        className="jwc-rise"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-panel)',
          padding: { mobile: '28px 22px', tablet688: '48px 44px' },
          background:
            'radial-gradient(70% 120% at 100% 0%, rgba(159,211,220,.45), rgba(159,211,220,0) 60%), var(--jwc-glass)',
          boxShadow: 'var(--jwc-glass-stroke), var(--jwc-card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <JwcEyebrow text={t('tr_jwcHomeEyebrow')} />

        <Typography
          id="jwc-home-title"
          component="h1"
          sx={jwcType({
            fontSize: { mobile: '36px', tablet688: '52px' },
            fontWeight: 400,
            lineHeight: 1.04,
            letterSpacing: '-0.04em',
            color: 'var(--black)',
            maxWidth: '12ch',
            ':lang(ml) &': { letterSpacing: 0, lineHeight: 1.35 },
          })}
        >
          {t('tr_jwcHomeTitle')}
        </Typography>

        <Typography
          sx={jwcType({
            fontSize: { mobile: '16px', tablet688: '19px' },
            lineHeight: 1.55,
            color: 'var(--grey-400)',
            maxWidth: '46ch',
            ':lang(ml) &': { lineHeight: 1.7 },
          })}
        >
          {t('tr_jwcHomeDesc')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            marginTop: '6px',
          }}
        >
          <Button
            variant="main"
            onClick={handleOpenSchedule}
            endIcon={<JwcArrowChip />}
            sx={{
              ...jwcPrimaryButtonSx,
              minHeight: '52px',
              paddingRight: '22px',
              width: { mobile: '100%', tablet: 'auto' },
              justifyContent: { mobile: 'space-between', tablet: 'center' },
              gap: '14px',
            }}
          >
            {t('tr_jwcOpenSchedule')}
          </Button>

          {countFutureAssignments > 0 && (
            <Button
              variant="tertiary"
              onClick={handleOpenMyAssignments}
              sx={{
                ...jwcSecondaryButtonSx,
                width: { mobile: '100%', tablet: 'auto' },
              }}
            >
              {t('tr_jwcMyAssignments', { count: countFutureAssignments })}
            </Button>
          )}
        </Box>
      </Box>

      {/* this week */}
      {showMeetingCard && (
        <Box
          component="section"
          aria-labelledby="jwc-home-week"
          sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <JwcEyebrow text={t('tr_jwcThisWeek')} />
            <Typography id="jwc-home-week" component="h2" className="h2">
              {t('tr_jwcWeekOf', { date: weekLabel })}
            </Typography>
          </Box>

          <JwcWeekPreview />
        </Box>
      )}

      {/* coming soon */}
      <Box
        component="section"
        aria-labelledby="jwc-home-soon"
        sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <JwcEyebrow text={t('tr_jwcComingSoon')} />
          <Typography
            id="jwc-home-soon"
            className="body-regular"
            color="var(--grey-400)"
          >
            {t('tr_jwcComingSoonDesc')}
          </Typography>
        </Box>

        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: {
              mobile: '1fr',
              tablet600: 'repeat(3, 1fr)',
            },
            gap: '12px',
          }}
        >
          {COMING_SOON.map(({ key, Icon }) => (
            <Box
              component="li"
              key={key}
              aria-disabled="true"
              sx={{
                ...jwcCardSx,
                boxShadow: 'none',
                border: '1px solid var(--jwc-line)',
                backgroundColor: 'transparent',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                '& svg, & svg g, & svg g path': { fill: 'var(--grey-350)' },
              }}
            >
              <Icon width={22} height={22} />
              <Typography
                className="body-regular"
                color="var(--grey-400)"
                sx={{ flex: 1 }}
              >
                {t(key)}
              </Typography>
              <Typography
                component="span"
                className="label-small-medium"
                sx={jwcType({
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--accent-150)',
                  boxShadow: 'inset 0 0 0 1px var(--accent-200)',
                  color: 'var(--accent-main)',
                  whiteSpace: 'nowrap',
                })}
              >
                {t('tr_jwcSoon')}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {!tablet688Up && <JwcAppNav />}

      {newCongSnack && (
        <Snackbar
          open={newCongSnack}
          variant="success"
          messageIcon={<IconCheckCircle color="var(--always-white)" />}
          messageHeader={t('tr_welcomeCongregationTitle')}
          message={t('tr_welcomeCongregationDesc')}
          onClose={handleCloseNewCongNotice}
        />
      )}
    </Box>
  );
};

export default Home;
