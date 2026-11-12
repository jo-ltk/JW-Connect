import { Box } from '@mui/material';
import { useAppTranslation } from '@hooks/index';
import { jwcType } from '../styles';
import Typography from '@components/typography';

/**
 * JW Connect wordmark. Typeset like the MEPTOR logo (600 weight, wide
 * tracking, uppercase) next to a small light-teal mark.
 */
const JwcLogo = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useAppTranslation();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Box
        aria-hidden
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: '32px',
          height: '32px',
          flexShrink: 0,
          borderRadius: '10px',
          background:
            'var(--jwc-primary-bg, linear-gradient(180deg,#dcf0f3,#98ccd5))',
          boxShadow:
            'inset 0 1px 1px rgba(255,255,255,.9), inset 0 0 0 1px rgba(255,255,255,.55), 0 6px 14px -8px rgba(70,150,160,.6)',
          color: '#12363c',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        JW
      </Box>
      {!compact && (
        <Typography
          component="span"
          sx={jwcType({
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--black)',
            whiteSpace: 'nowrap',
          })}
        >
          {t('tr_jwcAppName')}
        </Typography>
      )}
    </Box>
  );
};

export default JwcLogo;
