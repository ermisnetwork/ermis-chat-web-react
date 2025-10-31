import React, { useEffect } from 'react';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { Badge, Box, IconButton, Stack, Tooltip } from '@mui/material';
import AntSwitch from '../../components/AntSwitch';
import useSettings from '../../hooks/useSettings';
import { Nav_Buttons } from '../../data';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateTab } from '../../redux/slices/app';
import Logo from '../../assets/Images/logo.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_PATH, WIDTH_SIDE_NAV } from '../../config';
import useResponsive from '../../hooks/useResponsive';
import { setCurrentChannel, setCurrentChannelStatus } from '../../redux/slices/channel';
import { ContactType, CurrentChannelStatus, TabType } from '../../constants/commons-const';
import { SetOpenTopicPanel } from '../../redux/slices/topic';
import { useTranslation } from 'react-i18next';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: 'inherit',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    color: '#fff',
    '& .smileChatIcon': {
      '& .path-1': {
        stroke: theme.palette.primary.main,
        fill: theme.palette.primary.main,
      },
    },

    '& .phoneIcon': {
      '& .path-1': {
        fill: theme.palette.primary.main,
      },
      '& path': {
        stroke: theme.palette.primary.main,
      },
    },

    '& .userSquareIcon': {
      '& .path-2': {
        fill: theme.palette.primary.main,
      },
      '& path': {
        stroke: 'transparent',
      },
    },

    '& .moreIcon': {
      '& path': {
        fill: theme.palette.primary.main,
        stroke: theme.palette.primary.main,
      },
    },
  },
  '&.selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '& .smileChatIcon': {
      '& .path-1': {
        stroke: '#fff !important',
        fill: '#fff !important',
      },
    },

    '& .phoneIcon': {
      '& .path-1': {
        fill: '#fff !important',
      },
      '& path': {
        stroke: '#fff !important',
      },
    },

    '& .userSquareIcon': {
      '& .path-2': {
        fill: '#fff !important',
      },
      '& path': {
        stroke: 'transparent !important',
      },
    },

    '& .moreIcon': {
      '& path': {
        fill: '#fff !important',
        stroke: '#fff !important',
      },
    },
  },
}));

const SideBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobileToMd = useResponsive('down', 'md');

  const { tab } = useSelector(state => state.app);
  const { pendingChannels = [] } = useSelector(state => state.channel);

  const { onToggleMode } = useSettings();

  useEffect(() => {
    if (location.pathname.startsWith('/contacts')) {
      dispatch(UpdateTab({ tab: TabType.Contact }));
    } else {
      dispatch(UpdateTab({ tab: TabType.Chat }));
    }
  }, [location.pathname, dispatch]);

  const selectedTab = tab;

  const handleChangeTab = index => {
    dispatch(SetOpenTopicPanel(false));
    switch (index) {
      case TabType.Chat:
        navigate(DEFAULT_PATH);
        break;
      case TabType.Contact:
        if (isMobileToMd) {
          navigate('/contacts');
        } else {
          navigate(`/contacts/#${ContactType.Friends}`);
        }
        break;
      default:
        break;
    }

    dispatch(setCurrentChannel(null));
    dispatch(setCurrentChannelStatus(CurrentChannelStatus.IDLE));
  };

  const renderNavButtons = () => {
    return Nav_Buttons.map(el => {
      const isSelected = el.index === selectedTab;
      return (
        <Tooltip title={t(el.title)} key={el.index} placement="right">
          <StyledIconButton
            onClick={() => handleChangeTab(el.index)}
            sx={{
              borderRadius: 1.5,
            }}
            className={isSelected ? 'selected' : ''}
          >
            {el.icon}
            {el.index === TabType.Contact && pendingChannels && (
              <Badge
                color="error"
                badgeContent={pendingChannels.length}
                sx={{
                  '& .MuiBadge-badge': {
                    top: '-20px',
                  },
                }}
              />
            )}
          </StyledIconButton>
        </Tooltip>
      );
    });
  };

  const onGoToHome = () => {
    navigate(DEFAULT_PATH);
    dispatch(setCurrentChannel(null));
    dispatch(setCurrentChannelStatus(CurrentChannelStatus.IDLE));
    dispatch(SetOpenTopicPanel(false));
  };

  const getResponsiveStyles = () => {
    if (isMobileToMd) {
      return {
        container: {
          width: '100%',
          height: '60px',
          borderTop: `1px solid ${theme.palette.divider}`,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1,
        },
        navigation: {
          flexDirection: 'row',
          height: '100%',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 16px',
          children: {
            flexDirection: 'row',
            gap: 3,
          },
        },
        logo: {
          display: 'none',
        },
        switch: {
          display: 'none',
        },
      };
    } else {
      return {
        container: {
          height: '100%',
          width: `${WIDTH_SIDE_NAV}px`,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'relative',
        },
        navigation: {
          height: 'calc(100% - 70px)',
          width: '100%',
          children: {
            width: 'max-content',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          },
        },
        logo: {
          width: '100%',
          height: '70px',
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        switch: {
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        },
      };
    }
  };

  const styles = getResponsiveStyles();

  return (
    <Box sx={styles.container}>
      <Stack direction="row" justifyContent="center" alignItems="center" sx={styles.logo}>
        <Box onClick={onGoToHome} sx={{ cursor: 'pointer' }}>
          <img src={Logo} alt="logo" />
        </Box>
      </Stack>

      <Stack alignItems={'center'} justifyContent="center" sx={styles.navigation}>
        <Stack sx={styles.navigation.children}>{renderNavButtons()}</Stack>
      </Stack>

      <Box sx={styles.switch}>
        <AntSwitch defaultChecked={theme.palette.mode === 'dark'} onChange={onToggleMode} />
      </Box>
    </Box>
  );
};

export default SideBar;
