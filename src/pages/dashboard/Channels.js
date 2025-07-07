import React, { useEffect, useMemo } from 'react';
import { Stack, Typography, Tabs, Tab, Chip } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import ChatElement from '../../components/ChatElement';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTabChannel } from '../../redux/slices/channel';
import { ChatType, TabValueChannel } from '../../constants/commons-const';
import HomeSearch from '../../components/Search/HomeSearch';
import SkeletonChannels from '../../components/SkeletonChannels';
import FlipMove from 'react-flip-move';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 'auto',
  '& .MuiTab-root': {
    marginRight: '3px!important',
    minWidth: 0,
    minHeight: 'auto',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 700,
    borderRadius: '16px',
    // color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: alpha(theme.palette.divider, 0.1),
      color: theme.palette.primary.main,
    },
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },

    '& .MuiChip-root': {
      height: '18px',
      minWidth: '18px',
      fontSize: '12px',
      backgroundColor: theme.palette.text.secondary,
      color: '#fff',
      padding: '0px 4px',
      '& .MuiChip-label': {
        padding: '0px',
      },
    },
  },

  '& .MuiTabs-indicator': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    height: '100%',
    borderRadius: '16px',
  },

  '& .MuiTabs-scrollButtons': {
    width: 'auto',
    borderRadius: '6px',
    padding: '2px',
  },
}));

const Channels = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { activeChannels, pendingChannels, loadingChannels, pinnedChannels, tabsChannels, selectedTabChannel } =
    useSelector(state => state.channel);

  useEffect(() => {
    if (!tabsChannels.find(tab => tab.value === selectedTabChannel)) {
      dispatch(setSelectedTabChannel(TabValueChannel.All));
    }
  }, [tabsChannels, selectedTabChannel]);

  const renderedChannels = useMemo(() => {
    let displayChannels = [];
    let displayPinnedChannels = [];

    switch (selectedTabChannel) {
      case TabValueChannel.All:
        displayChannels = activeChannels || [];
        displayPinnedChannels = pinnedChannels || [];
        break;
      case TabValueChannel.Group:
        displayChannels = (activeChannels || []).filter(c => c.type === ChatType.TEAM);
        break;
      case TabValueChannel.Unread:
        // displayChannels = (activeChannels || []).filter(c => c.type === ChatType.MESSAGING);
        break;
      case TabValueChannel.Invite:
        displayChannels = pendingChannels || [];
        break;
      default:
        displayChannels = activeChannels || [];
        break;
    }

    if (loadingChannels) {
      return <SkeletonChannels />;
    } else {
      return (
        <>
          {displayPinnedChannels && displayPinnedChannels.length > 0 && (
            <FlipMove duration={200}>
              {displayPinnedChannels.map(item => (
                <div className="channelItem" key={`pinned-${item.id}`}>
                  <ChatElement channel={item} />
                </div>
              ))}
            </FlipMove>
          )}

          {displayChannels && displayChannels.length > 0 ? (
            <FlipMove duration={200}>
              {displayChannels.map(item => {
                return (
                  <div className="channelItem" key={`channel-${item.id}`}>
                    <ChatElement channel={item} />
                  </div>
                );
              })}
            </FlipMove>
          ) : (
            <div key="no-channels">
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                No channels
              </Typography>
            </div>
          )}
        </>
      );
    }
  }, [activeChannels, pendingChannels, pinnedChannels, loadingChannels, selectedTabChannel]);

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
      <Stack spacing={2}>
        <HomeSearch channels={activeChannels} />
        <StyledTabs
          value={selectedTabChannel}
          onChange={(event, newValue) => {
            dispatch(setSelectedTabChannel(newValue));
          }}
          variant="scrollable"
        >
          {tabsChannels.map((item, index) => {
            return (
              <Tab
                key={index}
                value={item.value}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{item.label}</span> {item.value !== TabValueChannel.All && <Chip label={item.count} />}
                  </Stack>
                }
              />
            );
          })}
        </StyledTabs>
      </Stack>

      <Stack
        className="customScrollbar"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'calc(100% - 167px)',
          marginLeft: '-15px!important',
          marginRight: '-15px!important',
          marginTop: '0px!important',
          padding: '15px',
        }}
      >
        <Stack spacing={2}>{renderedChannels}</Stack>
      </Stack>
    </Stack>
  );
};

export default Channels;
