/*
Shared MEPTOR surfaces for the JW Connect screens (docs/02-design-system.md).
All values come from the variables in src/global/jwc.css.
*/

const EASE = 'var(--jwc-ease)';

/**
 * Text styles that must win over the Organized typography classes
 * (.body-regular, .button-caps…), which every Typography and Button carries.
 * "&&" doubles the class specificity of the sx rule.
 */
export const jwcType = <T extends object>(styles: T) => ({ '&&': styles });

// .gb.pr: light-teal pill, ink-teal text
export const jwcPrimaryButtonSx = {
  minHeight: '48px',
  padding: '0 22px',
  borderRadius: '999px',
  border: 'none',
  color: 'var(--jwc-primary-text)',
  background: 'var(--jwc-primary-bg)',
  backgroundColor: 'transparent',
  boxShadow: 'var(--jwc-primary-shadow)',
  // && outranks the Organized text classes (button-caps…)
  '&&': {
    fontSize: '15px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    textTransform: 'none',
  },
  transition: `translate .6s ${EASE}, box-shadow .6s ${EASE}`,
  '& svg, & svg g, & svg g path': { fill: 'var(--jwc-primary-text)' },
  '&:hover': {
    background: 'var(--jwc-primary-bg)',
    boxShadow: 'var(--jwc-primary-shadow-hover)',
    translate: '0 -1px',
    '& .jwc-arrow': { transform: 'translateX(3px) rotate(0deg)' },
  },
  '&:active': { translate: '0 0', scale: '0.98' },
  '&.Mui-disabled': {
    opacity: 0.55,
    color: 'var(--jwc-primary-text)',
    background: 'var(--jwc-primary-bg)',
  },
};

// .gb: frosted-glass pill
export const jwcSecondaryButtonSx = {
  minHeight: '44px',
  padding: '0 18px',
  borderRadius: '999px',
  border: 'none',
  color: 'var(--jwc-ink)',
  background: 'var(--jwc-glass)',
  backgroundColor: 'transparent',
  boxShadow: 'var(--jwc-secondary-shadow)',
  '&&': {
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    textTransform: 'none',
  },
  transition: `translate .6s ${EASE}, box-shadow .6s ${EASE}`,
  '& svg, & svg g, & svg g path': { fill: 'var(--jwc-ink)' },
  '&:hover': {
    background: 'var(--jwc-glass)',
    boxShadow: 'var(--jwc-secondary-shadow-hover)',
    translate: '0 -1px',
  },
  '&:active': { translate: '0 0', scale: '0.98' },
};

// large rounded white card (hero-card / panel)
export const jwcCardSx = {
  backgroundColor: 'var(--jwc-card)',
  borderRadius: 'var(--radius-xxl)',
  boxShadow: 'var(--jwc-card-shadow)',
};

// sticky / floating glass surface (nav-bg, sheet)
export const jwcGlassBarSx = {
  background: 'var(--jwc-glass-bar)',
  WebkitBackdropFilter: 'var(--jwc-glass-blur)',
  backdropFilter: 'var(--jwc-glass-blur)',
  boxShadow:
    'var(--jwc-glass-stroke), 0 10px 30px -18px rgba(13, 25, 28, 0.35)',
};
