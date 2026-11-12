import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { dutiesLoadedState, dutiesSelectedWeekState } from '@states/duties';
import { isDarkThemeState } from '@states/app';
import { DutyEngineResult } from '@definition/duties';
import { addWeeks, formatDate, getWeekDate } from '@utils/date';
import { useAppTranslation } from '@hooks/index';
import { displaySnackNotification } from '@services/states/app';
import { getMessageByCode } from '@services/i18n/translation';
import {
  DutyError,
  dutiesEnsureDefaults,
  dutiesGenerateWeek,
  dutyRemovePerson,
  dutySetWeekStatus,
  dutyToggleLock,
} from '@services/app/duties';
import useDutyWeek from '@features/meetings/duties/useDutyWeek';

const toWeekOf = (date: Date) => formatDate(getWeekDate(date), 'yyyy/MM/dd');

const useMeetingDuties = () => {
  const { t } = useAppTranslation();

  const loaded = useAtomValue(dutiesLoadedState);
  const isDark = useAtomValue(isDarkThemeState);
  const [weekOf, setWeekOf] = useAtom(dutiesSelectedWeekState);

  const week = useDutyWeek(weekOf);

  const [lastRun, setLastRun] = useState<{
    weekOf: string;
    result: DutyEngineResult;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignSlot, setAssignSlot] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!weekOf) setWeekOf(toWeekOf(new Date()));
  }, [weekOf, setWeekOf]);

  useEffect(() => {
    if (loaded) dutiesEnsureDefaults();
  }, [loaded]);

  const showError = (error: unknown) => {
    const message =
      error instanceof DutyError
        ? t(error.message)
        : getMessageByCode((error as Error)?.message);

    displaySnackNotification({
      header: getMessageByCode('error_app_generic-title'),
      message,
      severity: 'error',
    });
  };

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      showError(error);
    }
  };

  const handleWeekChange = (value: Date | string) => {
    setLastRun(null);
    setWeekOf(toWeekOf(new Date(value)));
  };

  const handlePrevWeek = () => handleWeekChange(addWeeks(weekOf, -1));

  const handleNextWeek = () => handleWeekChange(addWeeks(weekOf, 1));

  const handleThisWeek = () => handleWeekChange(new Date());

  const handleGenerate = () =>
    run(async () => {
      if (isGenerating) return;
      setIsGenerating(true);

      try {
        const result = await dutiesGenerateWeek(weekOf);
        setLastRun({ weekOf, result });
      } finally {
        setIsGenerating(false);
      }
    });

  const handleToggleLock = (slot_id: string) =>
    run(() => dutyToggleLock(weekOf, slot_id));

  const handleRemove = (slot_id: string) =>
    run(() => dutyRemovePerson(weekOf, slot_id));

  const handlePublish = () => run(() => dutySetWeekStatus(weekOf, 'published'));

  const handleUnpublish = () => run(() => dutySetWeekStatus(weekOf, 'draft'));

  const shortages = lastRun?.weekOf === weekOf ? lastRun.result.shortages : [];

  return {
    weekOf,
    isDark,
    week,
    shortages,
    isGenerating,
    handlePrevWeek,
    handleNextWeek,
    handleThisWeek,
    handleWeekChange,
    handleGenerate,
    handleToggleLock,
    handleRemove,
    handlePublish,
    handleUnpublish,
    showError,
    assignSlot,
    setAssignSlot,
    swapSlot,
    setSwapSlot,
    settingsOpen,
    setSettingsOpen,
    historyOpen,
    setHistoryOpen,
  };
};

export default useMeetingDuties;
