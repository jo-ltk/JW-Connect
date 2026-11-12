import { Box, ButtonBase, Portal } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import { IconCalendarWeek, IconHome } from '@components/icons';
import { useAppTranslation, useBreakpoints } from '@hooks/index';
import { jwcGlassBarSx, jwcType } from '../styles';
import Typography from '@components/typography';

/**
 * The only navigation of JW Connect: Home and Schedule.
 * Phones: fixed glass bar at the bottom. Larger screens: a pill switch.
 */
const JwcAppNav = () => {
  const { t } = useAppTranslation();
  const { tablet688Up } = useBreakpoints();

  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { path: '/', label: t('tr_jwcHome'), Icon: IconHome },
    { path: '/schedule', label: t('tr_jwcSchedule'), Icon: IconCalendarWeek },
  ];

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  const nav = (
    <Box
      component="nav"
      aria-label={t('tr_jwcMainNav')}
      className="mui-fixed"
      sx={{
        ...jwcGlassBarSx,
        display: 'flex',
        gap: '4px',
        padding: '5px',
        borderRadius: tablet688Up ? '999px' : '20px',
        ...(tablet688Up
          ? { width: 'fit-content' }
          : {
              position: 'fixed',
              left: '12px',
              right: '12px',
              bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              zIndex: 1100,
            }),
      }}
    >
      {items.map(({ path, label, Icon }) => {
        const active = isActive(path);

        return (
          <ButtonBase
            key={path}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(path)}
            sx={{
              flex: tablet688Up ? 'unset' : 1,
              minHeight: tablet688Up ? '40px' : '54px',
              padding: tablet688Up ? '0 18px' : '0 12px',
              gap: '8px',
              flexDirection: tablet688Up ? 'row' : 'column',
              borderRadius: tablet688Up ? '999px' : '16px',
              color: active ? 'var(--jwc-primary-text)' : 'var(--grey-400)',
              background: active ? 'var(--jwc-primary-bg)' : 'transparent',
              boxShadow: active ? 'var(--jwc-primary-shadow)' : 'none',
              transition:
                'background .4s var(--jwc-ease), box-shadow .4s var(--jwc-ease), color .3s',
              '&:hover': {
                color: active ? 'var(--jwc-primary-text)' : 'var(--black)',
              },
              '& svg, & svg g, & svg g path': {
                fill: active ? 'var(--jwc-primary-text)' : 'var(--grey-400)',
              },
            }}
          >
            <Icon width={22} height={22} />
            <Typography
              component="span"
              sx={jwcType({
                fontSize: tablet688Up ? '14px' : '12px',
                fontWeight: 500,
                color: 'inherit',
              })}
            >
              {label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );

  // Phones: the bar is fixed to the screen. Pages are wrapped in an animated
  // (transformed) element, which would trap a fixed child, so it is rendered
  // directly in <body>.
  return tablet688Up ? nav : <Portal>{nav}</Portal>;
};

export default JwcAppNav;
