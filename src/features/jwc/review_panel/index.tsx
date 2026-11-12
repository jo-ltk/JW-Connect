import { Box } from '@mui/material';
import { IconCheckCircle, IconInfo } from '@components/icons';
import { useAppTranslation } from '@hooks/index';
import { jwcCardSx, jwcSecondaryButtonSx } from '../styles';
import Button from '@components/button';
import JwcEyebrow from '../eyebrow';
import JwcProgress from '../progress';
import Typography from '@components/typography';

type JwcReviewPanelProps = {
  assigned: number;
  total: number;
  canPublish: boolean;
  onKeepEditing: VoidFunction;
};

/** Review step: how complete the week is, and what publishing does. */
const JwcReviewPanel = ({
  assigned,
  total,
  canPublish,
  onKeepEditing,
}: JwcReviewPanelProps) => {
  const { t } = useAppTranslation();

  const missing = Math.max(total - assigned, 0);
  const complete = total > 0 && missing === 0;

  return (
    <Box
      component="section"
      aria-labelledby="jwc-review-title"
      data-testid="jwc-review"
      className="jwc-rise"
      sx={{
        ...jwcCardSx,
        padding: { mobile: '18px', tablet688: '24px' },
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: complete
          ? 'radial-gradient(80% 140% at 100% 0%, rgba(159,211,220,.35), rgba(159,211,220,0) 60%), var(--jwc-card)'
          : 'var(--jwc-card)',
      }}
    >
      <JwcEyebrow text={t('tr_jwcStepReview')} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Box
          sx={{
            marginTop: '2px',
            '& svg, & svg g, & svg g path': {
              fill: complete ? 'var(--accent-main)' : 'var(--orange-dark)',
            },
          }}
        >
          {complete ? (
            <IconCheckCircle width={26} height={26} />
          ) : (
            <IconInfo width={26} height={26} />
          )}
        </Box>
        <Typography id="jwc-review-title" component="h2" className="h2">
          {complete
            ? t('tr_jwcReviewComplete')
            : t('tr_jwcReviewMissing', { count: missing })}
        </Typography>
      </Box>

      {total > 0 && (
        <JwcProgress
          value={assigned}
          max={total}
          label={t('tr_jwcAssignedCount', { assigned, total })}
        />
      )}

      <Typography className="body-regular" color="var(--grey-400)">
        {canPublish ? t('tr_jwcPublishHint') : t('tr_jwcExportHint')}
      </Typography>

      {!complete && (
        <Box>
          <Button
            variant="tertiary"
            onClick={onKeepEditing}
            disableAutoStretch
            sx={jwcSecondaryButtonSx}
          >
            {t('tr_jwcKeepEditing')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JwcReviewPanel;
