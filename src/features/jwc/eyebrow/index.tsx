import { Box } from '@mui/material';
import { jwcType } from '../styles';
import Typography from '@components/typography';

/**
 * MEPTOR eyebrow: small uppercase label with the teal square marker.
 * Scripts without letter case (Malayalam) just show the text with the marker.
 */
const JwcEyebrow = ({ text, id }: { text: string; id?: string }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Box
        aria-hidden
        sx={{
          width: '8px',
          height: '8px',
          flexShrink: 0,
          borderRadius: '2px',
          backgroundColor: 'var(--jwc-g3)',
          boxShadow: '0 0 0 3px var(--jwc-marker-ring)',
        }}
      />
      <Typography
        id={id}
        className="label-small-medium"
        color="var(--grey-400)"
        sx={jwcType({
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          ':lang(ml) &': {
            textTransform: 'none',
            letterSpacing: 0,
            fontSize: '12.5px',
          },
        })}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default JwcEyebrow;
