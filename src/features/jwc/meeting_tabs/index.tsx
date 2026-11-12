import { KeyboardEvent, useRef } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { useAppTranslation } from '@hooks/index';
import { jwcType } from '../styles';
import Typography from '@components/typography';

export type JwcMeetingTab = 'midweek' | 'weekend' | 'duties';

type JwcMeetingTabsProps = {
  tabs: JwcMeetingTab[];
  value: JwcMeetingTab;
  onChange: (value: JwcMeetingTab) => void;
};

const LABELS: Record<JwcMeetingTab, string> = {
  midweek: 'tr_midweek',
  weekend: 'tr_weekend',
  duties: 'tr_meetingDuties',
};

/**
 * Segmented pill switch (MEPTOR primary pill for the selected item).
 * Each tab is a route, so the selected meeting survives a reload.
 */
const JwcMeetingTabs = ({ tabs, value, onChange }: JwcMeetingTabsProps) => {
  const { t } = useAppTranslation();

  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    let next = -1;

    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft')
      next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;

    if (next === -1) return;

    event.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next]);
  };

  return (
    <Box
      role="tablist"
      aria-label={t('tr_jwcMeetingTabs')}
      sx={{
        display: 'flex',
        gap: '4px',
        padding: '5px',
        borderRadius: '999px',
        background: 'var(--jwc-glass)',
        boxShadow: 'var(--jwc-secondary-shadow)',
        width: { mobile: '100%', tablet688: 'fit-content' },
      }}
    >
      {tabs.map((tab, index) => {
        const selected = tab === value;

        return (
          <ButtonBase
            key={tab}
            ref={(element) => {
              refs.current[index] = element;
            }}
            role="tab"
            id={`jwc-tab-${tab}`}
            aria-selected={selected}
            aria-controls="jwc-schedule-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            sx={{
              flex: { mobile: 1, tablet688: 'unset' },
              minHeight: '44px',
              padding: '0 18px',
              borderRadius: '999px',
              background: selected ? 'var(--jwc-primary-bg)' : 'transparent',
              boxShadow: selected ? 'var(--jwc-primary-shadow)' : 'none',
              transition:
                'background .4s var(--jwc-ease), box-shadow .4s var(--jwc-ease)',
              '&:hover': {
                backgroundColor: selected ? undefined : 'var(--accent-150)',
              },
            }}
          >
            <Typography
              component="span"
              sx={jwcType({
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: selected ? 'var(--jwc-primary-text)' : 'var(--grey-400)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              })}
            >
              {t(LABELS[tab])}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default JwcMeetingTabs;
