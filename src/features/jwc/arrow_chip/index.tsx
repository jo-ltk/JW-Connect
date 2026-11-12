import { Box } from '@mui/material';
import { IconArrowLink } from '@components/icons';

/**
 * MEPTOR ".gb .ar": round white chip with an arrow, used only on
 * "open / next" actions. The arrow points right and turns -45° on hover.
 */
const JwcArrowChip = () => {
  return (
    <Box
      aria-hidden
      className="jwc-arrow"
      component="span"
      sx={{
        display: 'inline-grid',
        placeItems: 'center',
        width: '34px',
        height: '34px',
        marginRight: '-14px',
        borderRadius: '50%',
        background: 'var(--jwc-arrow-bg)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,.9), 0 3px 8px -2px rgba(13,25,28,.22), 0 1px 2px rgba(13,25,28,.1)',
        transform: 'rotate(45deg)',
        transition: 'transform .7s var(--jwc-ease)',
        '& svg, & svg g, & svg g path': { fill: '#0d191c !important' },
      }}
    >
      <IconArrowLink width={18} height={18} />
    </Box>
  );
};

export default JwcArrowChip;
