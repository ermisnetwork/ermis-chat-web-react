import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import useResponsive from '../../hooks/useResponsive';
import LeftPanel from './LeftPanel';
import { WIDTH_LEFT_PANEL } from '../../config';

const ClientsTabPanel = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { isUserConnected } = useSelector(state => state.app);
  const { openTopicPanel } = useSelector(state => state.topic);

  const isDesktop = useResponsive('up', 'xl');
  const isScreenMdToXl = useResponsive('between', null, 'md', 'xl');
  const isMobileToMd = useResponsive('down', 'md');
  const isEnabledTopics = currentChannel?.data?.topics_enabled;
  const widthBox = openTopicPanel ? '95px' : isDesktop ? `${WIDTH_LEFT_PANEL}px` : isScreenMdToXl ? '300px' : '100%';

  if (isMobileToMd && currentChannel) return null;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: widthBox,
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
          borderRadius: '16px',
          // transition: 'width 0.3s ease-in-out',
        }}
      >
        {isUserConnected && <LeftPanel />}
      </Box>
    </>
  );
};

export default ClientsTabPanel;
