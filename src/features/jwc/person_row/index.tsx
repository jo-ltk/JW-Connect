import { Box } from '@mui/material';
import { AssignmentFieldType } from '@definition/assignment';
import { useAppTranslation } from '@hooks/index';
import usePersonComponent from '@features/meetings/weekly_schedules/person_component/usePersonComponent';
import { jwcType } from '../styles';
import Typography from '@components/typography';

type JwcPersonRowProps = {
  label: string;
  week: string;
  assignment: AssignmentFieldType;
  dataView: string;
};

/**
 * One readable "role → person" row. The name comes from the same hook the
 * Organized schedule view uses (visiting speakers, CO, display names).
 */
const JwcPersonRow = ({
  label,
  week,
  assignment,
  dataView,
}: JwcPersonRowProps) => {
  const { t } = useAppTranslation();

  const { personData } = usePersonComponent({ week, assignment, dataView });

  const name = personData?.name;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 0',
        borderTop: '1px solid var(--jwc-line)',
      }}
    >
      <Typography className="body-small-regular" color="var(--grey-400)">
        {label}
      </Typography>
      <Typography
        className="body-regular"
        sx={jwcType({
          textAlign: 'end',
          fontWeight: 500,
          color: name ? 'var(--black)' : 'var(--grey-350)',
          overflowWrap: 'anywhere',
        })}
      >
        {name || t('tr_jwcNotAssigned')}
      </Typography>
    </Box>
  );
};

export default JwcPersonRow;
