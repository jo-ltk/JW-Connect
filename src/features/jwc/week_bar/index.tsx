import { Box } from '@mui/material';
import { IconChevronLeft, IconChevronRight } from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { dateFormatFriendly } from '@utils/date';
import { jwcGlassBarSx, jwcSecondaryButtonSx, jwcType } from '../styles';
import Button from '@components/button';
import DatePicker from '@components/date_picker';
import IconButton from '@components/icon_button';
import Typography from '@components/typography';

type JwcWeekBarProps = {
  week: string;
  firstWeek?: string;
  lastWeek?: string;
  isCurrentWeek: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  disabled?: boolean;
  onPrev: VoidFunction;
  onNext: VoidFunction;
  onThisWeek: VoidFunction;
  onPick: (value: Date) => void;
};

const arrowSx = {
  width: '48px',
  height: '48px',
  flexShrink: 0,
  borderRadius: '50%',
  background: 'var(--jwc-glass)',
  boxShadow: 'var(--jwc-secondary-shadow)',
  '& svg, & svg g, & svg g path': { fill: 'var(--black)' },
  '&.Mui-disabled': { opacity: 0.35, boxShadow: 'none' },
};

/** Week selection shared by Midweek, Weekend and Meeting duties. */
const JwcWeekBar = ({
  week,
  firstWeek,
  lastWeek,
  isCurrentWeek,
  canGoBack,
  canGoNext,
  disabled = false,
  onPrev,
  onNext,
  onThisWeek,
  onPick,
}: JwcWeekBarProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const label = week ? dateFormatFriendly(week) : '';

  return (
    <Box
      component="section"
      aria-label={t('tr_jwcWeekNav')}
      sx={{
        ...jwcGlassBarSx,
        position: 'sticky',
        top: '70px',
        zIndex: 5,
        borderRadius: '20px',
        padding: tablet688Up ? '8px 10px' : '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <IconButton
        aria-label={t('tr_jwcPrevWeek')}
        onClick={onPrev}
        disabled={disabled || !canGoBack}
        sx={arrowSx}
      >
        <IconChevronLeft />
      </IconButton>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          textAlign: 'center',
        }}
      >
        <Typography
          component="span"
          className="label-small-medium"
          color={isCurrentWeek ? 'var(--accent-main)' : 'var(--grey-400)'}
          sx={jwcType({
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            ':lang(ml) &': { textTransform: 'none', letterSpacing: 0 },
          })}
        >
          {isCurrentWeek ? t('tr_jwcThisWeek') : t('tr_jwcWeek')}
        </Typography>
        <Typography
          component="h2"
          aria-live="polite"
          data-testid="jwc-week-label"
          sx={jwcType({
            fontSize: tablet688Up ? '20px' : '17px',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: 'var(--black)',
            ':lang(ml) &': { letterSpacing: 0, lineHeight: 1.45 },
          })}
        >
          {t('tr_jwcWeekOf', { date: label })}
        </Typography>
      </Box>

      {tablet688Up && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isCurrentWeek && (
            <Button
              variant="tertiary"
              onClick={onThisWeek}
              disabled={disabled}
              sx={{ ...jwcSecondaryButtonSx, minHeight: '40px' }}
            >
              {t('tr_jwcThisWeek')}
            </Button>
          )}
          <Box sx={{ width: '190px' }}>
            <DatePicker
              label={t('tr_jwcPickWeek')}
              value={week ? new Date(week) : null}
              minDate={firstWeek ? new Date(firstWeek) : null}
              maxDate={lastWeek ? new Date(lastWeek) : null}
              readOnly={disabled}
              onChange={(value) => {
                if (value) onPick(value);
              }}
            />
          </Box>
        </Box>
      )}

      <IconButton
        aria-label={t('tr_jwcNextWeek')}
        onClick={onNext}
        disabled={disabled || !canGoNext}
        sx={arrowSx}
      >
        <IconChevronRight />
      </IconButton>

      {!tablet688Up && !isCurrentWeek && !disabled && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '-18px',
            transform: 'translateX(-50%)',
          }}
        >
          <Button
            variant="small"
            onClick={onThisWeek}
            disableAutoStretch
            sx={{
              ...jwcSecondaryButtonSx,
              minHeight: '30px',
              padding: '0 12px',
              '&&': { ...jwcSecondaryButtonSx['&&'], fontSize: '12px' },
            }}
          >
            {t('tr_jwcBackToThisWeek')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JwcWeekBar;
