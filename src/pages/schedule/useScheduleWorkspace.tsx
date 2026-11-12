import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAtom, useAtomValue } from 'jotai';
import { useBreakpoints, useCurrentUser } from '@hooks/index';
import { schedulesState, selectedWeekState } from '@states/schedules';
import { sourcesFormattedState } from '@states/sources';
import { dutiesSelectedWeekState } from '@states/duties';
import { congAccountConnectedState } from '@states/app';
import { userDataViewState } from '@states/settings';
import { schedulesWeekAssignmentsInfo } from '@services/app/schedules';
import useSharedHook from '@pages/dashboard/useSharedHook';
import useMeetingMaterials from '@pages/dashboard/meeting_materials/useMeetingMaterials';
import useJwcShell from '@features/jwc/useJwcShell';
import { jwcCurrentWeek, jwcPickWeek, jwcWeekOf } from '@features/jwc/weeks';

export type WorkspaceTab = 'midweek' | 'weekend' | 'duties';

export type WorkspaceMode = 'view' | 'edit' | 'review';

const TABS: WorkspaceTab[] = ['midweek', 'weekend', 'duties'];

/**
 * One workspace for the weekly schedule: Midweek, Weekend and Meeting duties
 * share the selected week. The tab is part of the URL (/schedule/midweek…)
 * because the Organized person selectors read the meeting from the path.
 */
const useScheduleWorkspace = () => {
  useJwcShell('schedule');

  const navigate = useNavigate();
  const params = useParams<{ meeting?: string }>();
  const { tablet688Up } = useBreakpoints();

  const { isMidweekEditor, isWeekendEditor, isPublicTalkCoordinator } =
    useCurrentUser();

  const { showMidweek, showWeekend } = useSharedHook();

  const isConnected = useAtomValue(congAccountConnectedState);
  const schedules = useAtomValue(schedulesState);
  const dataView = useAtomValue(userDataViewState);
  const weeksSource = useAtomValue(sourcesFormattedState);

  const [selectedWeek, setSelectedWeek] = useAtom(selectedWeekState);
  const [dutiesWeek, setDutiesWeek] = useAtom(dutiesSelectedWeekState);

  const [mode, setMode] = useState<WorkspaceMode>('view');
  const [openAutofill, setOpenAutofill] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openPublish, setOpenPublish] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const { handleOpenJWImport, handleOpenEPUBFile, isNavigatorOnline } =
    useMeetingMaterials();

  // phones: the person list opens as a bottom sheet (jwc.css), so the field
  // being filled in moves to the top of the screen, above the sheet
  useEffect(() => {
    if (tablet688Up) return;

    const handleFocus = (event: FocusEvent) => {
      const field = (event.target as HTMLElement)?.closest?.(
        '.MuiAutocomplete-root'
      );

      field?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    document.addEventListener('focusin', handleFocus);

    return () => document.removeEventListener('focusin', handleFocus);
  }, [tablet688Up]);

  // ── tabs (existing Organized permission rules) ──
  const tabs = useMemo(() => {
    const result: WorkspaceTab[] = [];

    if (showMidweek) result.push('midweek');
    if (showWeekend) result.push('weekend');

    // Meeting duties: same rule as the /meeting-duties route
    if (isMidweekEditor || isWeekendEditor) result.push('duties');

    return result;
  }, [showMidweek, showWeekend, isMidweekEditor, isWeekendEditor]);

  const tab = useMemo<WorkspaceTab>(() => {
    const wanted = params.meeting as WorkspaceTab;

    if (TABS.includes(wanted) && tabs.includes(wanted)) return wanted;

    return tabs[0] ?? 'midweek';
  }, [params.meeting, tabs]);

  useEffect(() => {
    if (params.meeting !== tab) {
      navigate(`/schedule/${tab}`, { replace: true });
    }
  }, [params.meeting, tab, navigate]);

  const canEdit = useMemo(() => {
    if (tab === 'midweek') return isMidweekEditor;
    if (tab === 'weekend') return isWeekendEditor || isPublicTalkCoordinator;

    return isMidweekEditor || isWeekendEditor;
  }, [tab, isMidweekEditor, isWeekendEditor, isPublicTalkCoordinator]);

  // ── weeks with meeting materials ──
  const weeks = useMemo(() => {
    return weeksSource
      .flatMap((year) => year.months.flatMap((month) => month.weeks))
      .sort();
  }, [weeksSource]);

  const hasWeeks = weeks.length > 0;

  const currentWeek = jwcCurrentWeek();

  // keep the shared week valid: default to this week (or the nearest one)
  useEffect(() => {
    if (!hasWeeks) return;

    if (!weeks.includes(selectedWeek)) {
      setSelectedWeek(jwcPickWeek(weeks, currentWeek));
    }
  }, [hasWeeks, weeks, selectedWeek, setSelectedWeek, currentWeek]);

  // the week every tab uses; duties also work before materials are imported
  const week = hasWeeks ? selectedWeek : currentWeek;

  useEffect(() => {
    if (week && dutiesWeek !== week) setDutiesWeek(week);
  }, [week, dutiesWeek, setDutiesWeek]);

  // Meeting duties renders only once it follows the shared week
  const dutiesReady = week.length > 0 && dutiesWeek === week;

  const weekIndex = weeks.indexOf(week);

  const handlePrevWeek = () => {
    if (weekIndex > 0) setSelectedWeek(weeks[weekIndex - 1]);
  };

  const handleNextWeek = () => {
    if (weekIndex !== -1 && weekIndex < weeks.length - 1) {
      setSelectedWeek(weeks[weekIndex + 1]);
    }
  };

  const handleThisWeek = () => setSelectedWeek(jwcPickWeek(weeks, currentWeek));

  const handlePickWeek = (value: Date) => {
    setSelectedWeek(jwcPickWeek(weeks, jwcWeekOf(value)));
  };

  // ── workflow: view → edit → review → publish ──
  const handleTabChange = (value: WorkspaceTab) => {
    navigate(`/schedule/${value}`);
  };

  // another meeting starts again from its schedule view; changing the week
  // keeps the mode, so several weeks can be edited in a row
  useEffect(() => {
    setMode('view');
  }, [tab]);

  const handleEdit = () => setMode('edit');

  const handleReview = () => {
    setMode('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToView = () => setMode('view');

  const meeting = tab === 'duties' ? null : tab;

  const progress = useMemo(() => {
    if (!meeting || !week) return { assigned: 0, total: 0 };

    return schedulesWeekAssignmentsInfo(week, meeting);
    // schedules: recompute after every saved assignment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting, week, schedules, dataView]);

  return {
    tab,
    tabs,
    canEdit,
    mode,
    meeting,
    week,
    weeks,
    hasWeeks,
    isCurrentWeek: week === currentWeek,
    canGoBack: weekIndex > 0,
    canGoNext: weekIndex !== -1 && weekIndex < weeks.length - 1,
    dutiesReady,
    dataView,
    progress,
    isConnected,
    isNavigatorOnline,
    handleTabChange,
    handlePrevWeek,
    handleNextWeek,
    handleThisWeek,
    handlePickWeek,
    handleEdit,
    handleReview,
    handleBackToView,
    handleOpenJWImport,
    handleOpenEPUBFile,
    openAutofill,
    setOpenAutofill,
    openExport,
    setOpenExport,
    openPublish,
    setOpenPublish,
    openSettings,
    setOpenSettings,
  };
};

export default useScheduleWorkspace;
