import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { dbAppSettingsUpdate } from '@services/dexie/settings';
import {
  backupAutoState,
  backupIntervalState,
  hapticsEnabledState,
} from '@states/settings';
import { useBreakpoints, useIsTouchDevice } from '@hooks/index';

const useAppSettings = () => {
  const { laptopUp } = useBreakpoints();

  const showHaptics = useIsTouchDevice();

  const autoBackup = useAtomValue(backupAutoState);
  const autoBackupInterval = useAtomValue(backupIntervalState);
  const hapticsOn = useAtomValue(hapticsEnabledState);

  const [autoSync, setAutoSync] = useState(autoBackup);
  const [autoSyncInterval, setAutoSyncInterval] = useState(autoBackupInterval);
  const [haptics, setHaptics] = useState(hapticsOn);

  const handleSwitchAutoBackup = async (value) => {
    setAutoSync(value);

    await dbAppSettingsUpdate({
      'user_settings.backup_automatic.enabled': {
        value,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleUpdateSyncInterval = async (value: number) => {
    setAutoSyncInterval(value);

    await dbAppSettingsUpdate({
      'user_settings.backup_automatic.interval': {
        value,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleUpdateHaptics = async (value: boolean) => {
    setHaptics(value);

    await dbAppSettingsUpdate({
      'user_settings.haptics_enabled': {
        value,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  useEffect(() => {
    setHaptics(hapticsOn);
  }, [hapticsOn]);

  return {
    autoSync,
    handleSwitchAutoBackup,
    autoSyncInterval,
    handleUpdateSyncInterval,
    laptopUp,
    haptics,
    handleUpdateHaptics,
    showHaptics,
  };
};

export default useAppSettings;
