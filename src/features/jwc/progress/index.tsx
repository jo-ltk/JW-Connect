import { Box } from '@mui/material';
import Typography from '@components/typography';

type JwcProgressProps = {
  value: number;
  max: number;
  label: string;
};

/** MEPTOR ".tm-prog": a 2px line with a teal fill, and its label. */
const JwcProgress = ({ value, max, label }: JwcProgressProps) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const complete = max > 0 && value >= max;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Typography
        className="body-small-semibold"
        color={complete ? 'var(--accent-main)' : 'var(--grey-400)'}
      >
        {label}
      </Typography>
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        sx={{
          height: '2px',
          borderRadius: '2px',
          backgroundColor: 'var(--accent-200)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: 'var(--jwc-g4)',
            transition: 'width .6s var(--jwc-ease)',
          }}
        />
      </Box>
    </Box>
  );
};

export default JwcProgress;
