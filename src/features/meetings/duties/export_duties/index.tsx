import { IconPrint } from '@components/icons';
import { useAppTranslation } from '@hooks/index';
import NavBarButton from '@components/nav_bar_button';
import useExportDuties from './useExportDuties';

const ExportDuties = ({
  weekOf,
  disabled,
  textImportant,
}: {
  weekOf: string;
  disabled?: boolean;
  /** keep the label on phones (inside a page instead of the nav bar) */
  textImportant?: boolean;
}) => {
  const { t } = useAppTranslation();

  const { isProcessing, handleExport } = useExportDuties(weekOf);

  return (
    <NavBarButton
      text={t('tr_dutyPrint')}
      icon={<IconPrint />}
      disabled={disabled || isProcessing}
      textImportant={textImportant}
      onClick={handleExport}
    />
  );
};

export default ExportDuties;
