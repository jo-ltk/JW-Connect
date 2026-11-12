import { Box } from '@mui/material';
import { IconCloudDone } from '@components/icons';
import { useAppTranslation } from '@hooks/index';
import useSavedIndicator from './useSavedIndicator';
import Typography from '@components/typography';

type JwcSavedIndicatorProps = {
  week: string;
  meeting: 'midweek' | 'weekend';
  dataView: string;
};

/**
 * Shows that assignments are already stored on this device. There is no Save
 * button: Organized saves every change the moment it is made.
 */
const JwcSavedIndicator = ({
  week,
  meeting,
  dataView,
}: JwcSavedIndicatorProps) => {
  const { t } = useAppTranslation();

  const { justSaved, savedLabel } = useSavedIndicator(week, meeting, dataView);

  let text = t('tr_jwcAutoSave');
  if (savedLabel) text = t('tr_jwcSavedAt', { time: savedLabel });
  if (justSaved) text = t('tr_jwcSavedJustNow');

  return (
    <Box
      role="status"
      aria-live="polite"
      data-testid="jwc-saved"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px 4px 6px',
        borderRadius: '999px',
        backgroundColor: justSaved ? 'var(--accent-150)' : 'transparent',
        transition: 'background-color .6s var(--jwc-ease)',
        '& svg, & svg g, & svg g path': {
          fill: justSaved ? 'var(--accent-main)' : 'var(--grey-350)',
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-grid',
          borderRadius: '50%',
          animation: justSaved ? 'jwc-pulse 1.2s var(--jwc-ease) 2' : 'none',
        }}
      >
        <IconCloudDone width={18} height={18} />
      </Box>
      <Typography
        component="span"
        className="body-small-semibold"
        color={justSaved ? 'var(--accent-main)' : 'var(--grey-400)'}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default JwcSavedIndicator;
