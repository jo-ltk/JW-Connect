import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { dateFormatFriendly } from '@utils/date';
import { BadgeColor } from '@definition/app';
import { DutyWeekStatus } from '../useDutyWeek';
import { dutyPanelSx } from '../duties_theme';
import Badge from '@components/badge';
import Button from '@components/button';
import DateNavigator from '@components/date_navigator';
import DatePicker from '@components/date_picker';
import Typography from '@components/typography';
import DutyEyebrow from '../eyebrow';

type DutyWeekBarProps = {
  weekOf: string;
  status: DutyWeekStatus;
  filled: number;
  total: number;
  onPrev: VoidFunction;
  onNext: VoidFunction;
  onToday: VoidFunction;
  onPick: (value: Date) => void;
  actions: ReactNode;
  /** the week is chosen elsewhere (JW Connect schedule workspace) */
  hideNavigation?: boolean;
};

const STATUS: Record<DutyWeekStatus, { key: string; color: BadgeColor }> = {
  not_started: { key: 'tr_dutyStatusNotStarted', color: 'grey' },
  draft: { key: 'tr_dutyStatusDraft', color: 'orange' },
  published: { key: 'tr_dutyStatusPublished', color: 'green' },
};

const DutyWeekBar = ({
  weekOf,
  status,
  filled,
  total,
  onPrev,
  onNext,
  onToday,
  onPick,
  actions,
  hideNavigation = false,
}: DutyWeekBarProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <Box
      component="section"
      aria-label={t('tr_dutyWeekSelection')}
      sx={{
        ...dutyPanelSx,
        padding: tablet688Up ? '20px 24px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {!hideNavigation && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DutyEyebrow text={t('tr_dutyWeek')} />
            <DateNavigator
              value={t('tr_dutyWeekOf', { date: dateFormatFriendly(weekOf) })}
              onBack={onPrev}
              onNext={onNext}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="small" onClick={onToday}>
              {t('tr_dutyThisWeek')}
            </Button>
            <Box sx={{ width: '180px' }}>
              <DatePicker
                label={t('tr_dutyPickWeek')}
                value={new Date(weekOf)}
                onChange={(value) => {
                  if (value) onPick(value);
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px',
            flex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge
              size="medium"
              color={STATUS[status].color}
              text={t(STATUS[status].key)}
              filled={false}
            />
            <Typography className="body-small-regular" color="var(--grey-400)">
              {t('tr_dutyFilledCount', { filled, total })}
            </Typography>
          </Box>

          <Box
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled}
            aria-label={t('tr_dutyFilledCount', { filled, total })}
            sx={{
              height: '2px',
              backgroundColor: 'var(--accent-200)',
              borderRadius: 'var(--radius-max)',
              overflow: 'hidden',
              maxWidth: '360px',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${percent}%`,
                backgroundColor: 'var(--accent-350)',
                transition: 'width 0.5s cubic-bezier(.16, 1, .3, 1)',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {actions}
        </Box>
      </Box>
    </Box>
  );
};

export default DutyWeekBar;
