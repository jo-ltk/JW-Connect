/*
MEPTOR visual language for the Meeting Duties screens (see
docs/02-design-system.md in the project workspace).

The Organized components read their colours from the --accent-* variables.
Redefining those variables on the Meeting Duties root gives every component
inside it the MEPTOR teal palette, without changing any other screen.
Values come from the design-system mapping (teal-light / teal-dark).
*/

const rgb = (name: string, base: string) => ({
  [`--${name}-base`]: base,
  [`--${name}`]: `rgba(var(--${name}-base), 1)`,
});

const TEAL_LIGHT = {
  ...rgb('accent-100', '241, 248, 249'),
  ...rgb('accent-150', '225, 241, 243'),
  ...rgb('accent-200', '195, 227, 232'),
  ...rgb('accent-300', '159, 211, 220'),
  ...rgb('accent-350', '125, 188, 198'),
  ...rgb('accent-400', '74, 91, 96'),
  ...rgb('accent-main', '43, 99, 107'),
  ...rgb('accent-dark', '18, 54, 60'),
  ...rgb('accent-click', '31, 76, 83'),
  // computed from --accent-main at the page root, so it must be redefined here
  '--accent-gradient-top': 'color-mix(in oklch, var(--accent-main), white 15%)',
  '--duty-marker': 'rgba(159, 211, 220, 1)',
  '--duty-panel-shadow':
    '0 0 0 1px rgba(13, 25, 28, 0.07), 0 10px 26px -12px rgba(13, 25, 28, 0.2), 0 2px 6px -2px rgba(13, 25, 28, 0.07)',
};

const TEAL_DARK = {
  ...rgb('accent-100', '10, 22, 25'),
  ...rgb('accent-150', '18, 38, 42'),
  ...rgb('accent-200', '30, 58, 63'),
  ...rgb('accent-300', '45, 92, 99'),
  ...rgb('accent-350', '90, 158, 168'),
  ...rgb('accent-400', '159, 190, 196'),
  ...rgb('accent-main', '47, 118, 128'),
  ...rgb('accent-dark', '159, 211, 220'),
  ...rgb('accent-click', '58, 138, 149'),
  // computed from --accent-main at the page root, so it must be redefined here
  '--accent-gradient-top': 'color-mix(in oklch, var(--accent-main), white 15%)',
  '--duty-marker': 'rgba(90, 158, 168, 1)',
  '--duty-panel-shadow': '0 0 0 1px rgba(236, 245, 246, 0.1)',
};

export const DUTY_EASE = 'cubic-bezier(.16, 1, .3, 1)';

export const dutiesThemeVars = (isDark: boolean) =>
  isDark ? TEAL_DARK : TEAL_LIGHT;

export type DutyThemeVars = ReturnType<typeof dutiesThemeVars>;

/**
 * Dialogs render in a portal, outside the themed page root: their paper gets
 * the same variables (and keeps the default Organized dialog look).
 */
export const dutyDialogPaper = (themeVars: DutyThemeVars, maxWidth = 560) => ({
  className: 'pop-up-shadow',
  style: {
    ...themeVars,
    maxWidth: `${maxWidth}px`,
    borderRadius: 'var(--radius-xxl)',
    backgroundColor: 'var(--white)',
  },
});

// large rounded surface used for each meeting (MEPTOR panel)
export const dutyPanelSx = {
  backgroundColor: 'var(--white)',
  borderRadius: 'var(--radius-xxl)',
  boxShadow: 'var(--duty-panel-shadow)',
  overflow: 'hidden',
};
