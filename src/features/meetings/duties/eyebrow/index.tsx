import { Box } from '@mui/material';
import Typography from '@components/typography';

/**
 * Small uppercase label with the teal square marker (MEPTOR "eyebrow").
 * Languages without letter case simply show the text with the marker.
 */
const DutyEyebrow = ({ text }: { text: string }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Box
        aria-hidden
        sx={{
          width: '8px',
          height: '8px',
          flexShrink: 0,
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--duty-marker)',
        }}
      />
      <Typography
        className="label-small-medium"
        color="var(--accent-400)"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default DutyEyebrow;
