import { Box } from '@mui/material';
import { AssignmentFieldType } from '@definition/assignment';
import { useAppTranslation } from '@hooks/index';
import { jwcCardSx } from '../styles';
import useWeekPreview, { JwcMeetingPreview } from './useWeekPreview';
import JwcEyebrow from '../eyebrow';
import JwcPersonRow from '../person_row';
import JwcProgress from '../progress';
import Typography from '@components/typography';

type MeetingCardProps = {
  id: string;
  title: string;
  week: string;
  dataView: string;
  meeting: JwcMeetingPreview;
  rows: { label: string; assignment: AssignmentFieldType }[];
  delay: number;
};

const MeetingCard = ({
  id,
  title,
  week,
  dataView,
  meeting,
  rows,
  delay,
}: MeetingCardProps) => {
  const { t } = useAppTranslation();

  return (
    <Box
      component="article"
      aria-labelledby={id}
      className="jwc-rise"
      sx={{
        ...jwcCardSx,
        padding: { mobile: '18px', tablet688: '22px 24px' },
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animationDelay: `${delay}ms`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <JwcEyebrow id={id} text={title} />
        <Typography className="h2">
          {meeting.dateLabel || t('tr_jwcNoMeetingMaterials')}
        </Typography>
        {meeting.subtitle && (
          <Typography className="body-small-regular" color="var(--grey-400)">
            {meeting.subtitle}
          </Typography>
        )}
      </Box>

      {meeting.dateLabel && !meeting.hasMeeting && (
        <Typography className="body-regular" color="var(--grey-400)">
          {t('tr_jwcNoMeeting')}
        </Typography>
      )}

      {meeting.hasMeeting && meeting.total > 0 && (
        <JwcProgress
          value={meeting.assigned}
          max={meeting.total}
          label={t('tr_jwcAssignedCount', {
            assigned: meeting.assigned,
            total: meeting.total,
          })}
        />
      )}

      {meeting.hasMeeting && (
        <Box>
          {rows.map((row) => (
            <JwcPersonRow
              key={row.assignment}
              week={week}
              dataView={dataView}
              label={row.label}
              assignment={row.assignment}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

/** This week's midweek and weekend meetings, from the real schedule data. */
const JwcWeekPreview = () => {
  const { t } = useAppTranslation();

  const { week, midweek, weekend, dataView } = useWeekPreview();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { mobile: '1fr', laptop: '1fr 1fr' },
        gap: '16px',
      }}
    >
      <MeetingCard
        id="jwc-preview-midweek"
        title={t('tr_midweekMeeting')}
        week={week}
        dataView={dataView}
        meeting={midweek}
        delay={120}
        rows={[
          { label: t('tr_chairman'), assignment: 'MM_Chairman_A' },
          { label: t('tr_bibleReading'), assignment: 'MM_TGWBibleReading_A' },
          { label: t('tr_jwcCbsConductor'), assignment: 'MM_LCCBSConductor' },
        ]}
      />
      <MeetingCard
        id="jwc-preview-weekend"
        title={t('tr_weekendMeeting')}
        week={week}
        dataView={dataView}
        meeting={weekend}
        delay={200}
        rows={[
          { label: t('tr_chairman'), assignment: 'WM_Chairman' },
          { label: t('tr_speaker'), assignment: 'WM_Speaker_Part1' },
          {
            label: t('tr_jwcWtConductor'),
            assignment: 'WM_WTStudy_Conductor',
          },
        ]}
      />
    </Box>
  );
};

export default JwcWeekPreview;
