import { Box } from '@mui/material';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { jwcType } from '../styles';
import Typography from '@components/typography';

export type JwcWorkflowMode = 'view' | 'edit' | 'review';

const STEPS = [
  { key: 'view', label: 'tr_jwcStepView' },
  { key: 'edit', label: 'tr_jwcStepEdit' },
  { key: 'review', label: 'tr_jwcStepReview' },
  { key: 'publish', label: 'tr_jwcStepPublish' },
] as const;

// kept for screen readers, not drawn
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

/**
 * View → Edit → Review → Publish, with the current step highlighted.
 * Phones show only the current step's name next to the markers.
 */
const JwcWorkflowSteps = ({ mode }: { mode: JwcWorkflowMode }) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const current = STEPS.findIndex((step) => step.key === mode);

  return (
    <Box
      component="ol"
      aria-label={t('tr_jwcWorkflow')}
      sx={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
      }}
    >
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <Box
            component="li"
            key={step.key}
            aria-current={active ? 'step' : undefined}
            sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {index > 0 && (
              <Box
                aria-hidden
                sx={{
                  width: '14px',
                  height: '1px',
                  backgroundColor:
                    done || active ? 'var(--jwc-g4)' : 'var(--jwc-line)',
                  transition: 'background-color .6s var(--jwc-ease)',
                }}
              />
            )}
            <Box
              aria-hidden
              sx={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                backgroundColor: active
                  ? 'var(--jwc-g3)'
                  : done
                    ? 'var(--jwc-g4)'
                    : 'var(--jwc-line)',
                boxShadow: active ? '0 0 0 3px var(--jwc-marker-ring)' : 'none',
                transition: 'all .6s var(--jwc-ease)',
              }}
            />
            <Typography
              component="span"
              className="label-small-medium"
              sx={jwcType({
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: active ? 'var(--black)' : 'var(--grey-350)',
                ':lang(ml) &': { textTransform: 'none', letterSpacing: 0 },
                ...(!tablet688Up && !active ? visuallyHidden : {}),
              })}
            >
              {t(step.label)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default JwcWorkflowSteps;
