import React from 'react';
import { Box, Stack, Tabs, Tab } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import useResponsive from '../../hooks/useResponsive';
import { SimpleBarStyle } from '../../components/Scrollbar';
import Channels from './Channels';
import MenuChain from '../../components/MenuChain';
import TabYourProjects from '../../sections/dashboard/TabYourProjects';
import TabNewProjects from '../../sections/dashboard/TabNewProjects';
import { SetTabIndexSdk } from '../../redux/slices/wallet';
import LeftPanel from './LeftPanel';
import { WIDTH_LEFT_PANEL } from '../../config';

const StyledChannelsBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 1,
  width: '100%',
  height: '100%',
  transition: 'all .3s',
  // visibility: 'hidden',
  // transform: 'scale(0.8)',
  // opacity: 0,
  // '&.open': {
  //   visibility: 'visible',
  //   transform: 'scale(1)',
  //   opacity: 1,
  // },
}));

const TAB_PROJECTS = ['Your projects', 'New projects'];

const ClientsTabPanel = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { projectCurrent, tabIndexSdk } = useSelector(state => state.wallet);
  const { currentChannel } = useSelector(state => state.channel);

  const isDesktop = useResponsive('up', 'xl');
  const isScreenMdToXl = useResponsive('between', null, 'md', 'xl');
  const isMobileToMd = useResponsive('down', 'md');

  const onChangeTab = (event, newValue) => {
    dispatch(SetTabIndexSdk(newValue));
  };

  if (isMobileToMd && currentChannel) return null;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: isDesktop ? `${WIDTH_LEFT_PANEL}px` : isScreenMdToXl ? '280px' : '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
          borderRadius: '16px',
        }}
      >
        {/* <Stack direction="row" sx={{ height: 'auto', padding: '15px' }}>
          <MenuChain />
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', padding: '0 15px' }}>
          <Tabs
            value={tabIndexSdk}
            onChange={onChangeTab}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
          >
            {TAB_PROJECTS.map((item, index) => {
              return <Tab key={index} label={item} />;
            })}
          </Tabs>
        </Box>

        <Stack
          className="customScrollbar"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            width: '100%',
            height: 'calc(100% - 115px)',
            padding: '15px',
            position: 'relative',
          }}
        >
          <SimpleBarStyle timeout={500} clickOnTrack={false}>
            <TabYourProjects tabIndex={tabIndexSdk} />
            <TabNewProjects tabIndex={tabIndexSdk} />
          </SimpleBarStyle>
        </Stack> */}

        {projectCurrent && (
          <StyledChannelsBox>
            <LeftPanel />
            {/* <Channels /> */}
          </StyledChannelsBox>
        )}
      </Box>
    </>
  );
};

export default ClientsTabPanel;
