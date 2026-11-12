import { useNavigate } from 'react-router';
import { dateFormatFriendly } from '@utils/date';
import useDashboard from '@pages/dashboard/useDashboard';
import useSharedHook from '@pages/dashboard/useSharedHook';
import useJwcShell from '@features/jwc/useJwcShell';
import { jwcCurrentWeek } from '@features/jwc/weeks';

const useHome = () => {
  useJwcShell('home');

  const navigate = useNavigate();

  // keeps the dashboard behaviour: "My assignments" PWA shortcut,
  // new congregation notice, and the personal assignment count
  const {
    countFutureAssignments,
    handleOpenMyAssignments,
    newCongSnack,
    handleCloseNewCongNotice,
  } = useDashboard();

  const { showMeetingCard } = useSharedHook();

  const weekLabel = dateFormatFriendly(jwcCurrentWeek());

  const handleOpenSchedule = () => navigate('/schedule');

  return {
    weekLabel,
    showMeetingCard,
    countFutureAssignments,
    handleOpenMyAssignments,
    handleOpenSchedule,
    newCongSnack,
    handleCloseNewCongNotice,
  };
};

export default useHome;
