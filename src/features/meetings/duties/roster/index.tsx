import { Box } from '@mui/material';
import { IconSettings } from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { dateFormatFriendly } from '@utils/date';
import { DutyMeetingView } from '../useDutyWeek';
import { dutyPanelSx } from '../duties_theme';
import { DUTY_MEETING_KEYS } from '../constants';
import Button from '@components/button';
import Typography from '@components/typography';
import DutyEyebrow from '../eyebrow';
import DutySlotRow from '../slot_row';

type DutyRosterProps = {
  meetings: DutyMeetingView[];
  onAssign: (slot_id: string) => void;
  onSwap: (slot_id: string) => void;
  onRemove: (slot_id: string) => void;
  onToggleLock: (slot_id: string) => void;
  onOpenSettings: VoidFunction;
};

const DutyRoster = ({
  meetings,
  onAssign,
  onSwap,
  onRemove,
  onToggleLock,
  onOpenSettings,
}: DutyRosterProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up, laptopUp } = useBreakpoints();

  const noDuties = meetings.every(
    (meeting) => !meeting.held || meeting.rows.length === 0
  );

  if (meetings.length > 0 && noDuties && meetings.some((m) => m.held)) {
    return (
      <Box
        sx={{
          ...dutyPanelSx,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Typography className="h3">{t('tr_dutyNoPositionsTitle')}</Typography>
        <Typography className="body-regular" color="var(--grey-400)">
          {t('tr_dutyNoPositionsDesc')}
        </Typography>
        <Button
          variant="secondary"
          startIcon={<IconSettings />}
          onClick={onOpenSettings}
        >
          {t('tr_dutyPositions')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: laptopUp ? '1fr 1fr' : '1fr',
        gap: '16px',
        alignItems: 'start',
      }}
    >
      {meetings.map((meeting) => (
        <Box
          key={meeting.meeting}
          component="section"
          aria-labelledby={`duty-meeting-${meeting.meeting}`}
          sx={dutyPanelSx}
        >
          <Box
            sx={{
              padding: tablet688Up ? '20px 24px 16px' : '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <DutyEyebrow text={t(DUTY_MEETING_KEYS[meeting.meeting])} />
            <Typography className="h2" id={`duty-meeting-${meeting.meeting}`}>
              {dateFormatFriendly(meeting.meeting_date)}
            </Typography>
          </Box>

          {!meeting.held && (
            <Box
              sx={{
                padding: tablet688Up ? '16px 24px 24px' : '16px',
                borderTop: '1px solid var(--accent-200)',
              }}
            >
              <Typography className="body-regular" color="var(--grey-400)">
                {t('tr_dutyNoMeetingThisWeek')}
              </Typography>
            </Box>
          )}

          {meeting.held && (
            <Box
              role="table"
              aria-labelledby={`duty-meeting-${meeting.meeting}`}
            >
              {meeting.rows.map((row) => (
                <DutySlotRow
                  key={row.slot.id}
                  row={row}
                  onAssign={onAssign}
                  onSwap={onSwap}
                  onRemove={onRemove}
                  onToggleLock={onToggleLock}
                />
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default DutyRoster;
