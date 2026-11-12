import { MouseEvent, ReactElement, useState } from 'react';
import { Box, ListItemIcon, ListItemText, Menu, Portal } from '@mui/material';
import {
  IconCheck,
  IconEdit,
  IconGenerate,
  IconImportFile,
  IconJwOrg,
  IconMore,
  IconPrint,
  IconPublish,
  IconSettings,
  IconVisibility,
} from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import {
  jwcGlassBarSx,
  jwcPrimaryButtonSx,
  jwcSecondaryButtonSx,
} from '../styles';
import { JwcWorkflowMode } from './steps';
import Button from '@components/button';
import IconButton from '@components/icon_button';
import MenuItem from '@components/menuitem';
import Typography from '@components/typography';

type JwcActionBarProps = {
  mode: JwcWorkflowMode;
  canPublish: boolean;
  isOnline: boolean;
  onEdit: VoidFunction;
  onReview: VoidFunction;
  onBackToView: VoidFunction;
  onPublish: VoidFunction;
  onExport: VoidFunction;
  onAutofill: VoidFunction;
  onSettings: VoidFunction;
  onImportJW: VoidFunction;
  onImportEPUB: VoidFunction;
};

type Action = {
  key: string;
  label: string;
  icon: ReactElement;
  onClick: VoidFunction;
};

/**
 * The next step of the schedule workflow as the main action, and the
 * existing Organized tools (autofill, export, settings, import) behind "More".
 * Phones: fixed above the bottom navigation. Larger screens: inline.
 */
const JwcActionBar = ({
  mode,
  canPublish,
  isOnline,
  onEdit,
  onReview,
  onBackToView,
  onPublish,
  onExport,
  onAutofill,
  onSettings,
  onImportJW,
  onImportEPUB,
}: JwcActionBarProps) => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const primary: Action =
    mode === 'view'
      ? {
          key: 'edit',
          label: t('tr_jwcEditAssignments'),
          icon: <IconEdit />,
          onClick: onEdit,
        }
      : mode === 'edit'
        ? {
            key: 'review',
            label: t('tr_jwcReviewAssignments'),
            icon: <IconCheck />,
            onClick: onReview,
          }
        : canPublish
          ? {
              key: 'publish',
              label: t('tr_publish'),
              icon: <IconPublish />,
              onClick: onPublish,
            }
          : {
              key: 'export',
              label: t('tr_jwcExportPdf'),
              icon: <IconPrint />,
              onClick: onExport,
            };

  const more: Action[] = [];

  if (mode !== 'view') {
    more.push({
      key: 'view',
      label: t('tr_jwcBackToSchedule'),
      icon: <IconVisibility />,
      onClick: onBackToView,
    });
  }

  more.push({
    key: 'autofill',
    label: t('tr_autofill'),
    icon: <IconGenerate />,
    onClick: onAutofill,
  });

  if (primary.key !== 'export') {
    more.push({
      key: 'export',
      label: t('tr_export'),
      icon: <IconPrint />,
      onClick: onExport,
    });
  }

  more.push({
    key: 'settings',
    label: t('tr_jwcMeetingSettings'),
    icon: <IconSettings />,
    onClick: onSettings,
  });

  if (isOnline) {
    more.push({
      key: 'import-jw',
      label: t('tr_sourceImportJw'),
      icon: <IconJwOrg />,
      onClick: onImportJW,
    });
  }

  more.push({
    key: 'import-epub',
    label: t('tr_sourceImportEPUB'),
    icon: <IconImportFile />,
    onClick: onImportEPUB,
  });

  const handleOpenMore = (event: MouseEvent<HTMLElement>) =>
    setAnchor(event.currentTarget);

  const handleCloseMore = () => setAnchor(null);

  const handleSelect = (action: Action) => {
    setAnchor(null);
    action.onClick();
  };

  const bar = (
    <Box
      data-testid="jwc-action-bar"
      className="mui-fixed"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...(tablet688Up
          ? {}
          : {
              ...jwcGlassBarSx,
              position: 'fixed',
              left: '12px',
              right: '12px',
              bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
              zIndex: 1100,
              padding: '6px',
              borderRadius: '999px',
              animation: 'jwc-rise .4s var(--jwc-ease) backwards',
            }),
      }}
    >
      <IconButton
        aria-label={t('tr_jwcMoreActions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={handleOpenMore}
        sx={{
          width: '48px',
          height: '48px',
          flexShrink: 0,
          borderRadius: '50%',
          background: 'var(--jwc-glass)',
          boxShadow: 'var(--jwc-secondary-shadow)',
          '& svg, & svg g, & svg g path': { fill: 'var(--black)' },
        }}
      >
        <IconMore />
      </IconButton>

      {tablet688Up && mode !== 'view' && (
        <Button
          variant="tertiary"
          onClick={onBackToView}
          sx={jwcSecondaryButtonSx}
        >
          {t('tr_jwcBackToSchedule')}
        </Button>
      )}

      <Button
        key={primary.key}
        variant="main"
        startIcon={primary.icon}
        onClick={primary.onClick}
        sx={{
          ...jwcPrimaryButtonSx,
          flex: tablet688Up ? 'unset' : 1,
          width: tablet688Up ? 'auto' : '100%',
        }}
      >
        {primary.label}
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={handleCloseMore}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: '240px', padding: '6px' } } }}
      >
        {more.map((action) => (
          <MenuItem
            key={action.key}
            onClick={() => handleSelect(action)}
            sx={{ minHeight: '48px', height: 'auto', borderRadius: '10px' }}
          >
            <ListItemIcon
              sx={{ '& svg, & svg g, & svg g path': { fill: 'var(--black)' } }}
            >
              {action.icon}
            </ListItemIcon>
            <ListItemText>
              <Typography className="body-regular">{action.label}</Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  // phones: fixed to the screen, so rendered in <body> (see JwcAppNav)
  return tablet688Up ? bar : <Portal>{bar}</Portal>;
};

export default JwcActionBar;
