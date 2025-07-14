import React, { useEffect, useMemo, useState } from 'react';
import { Stack, Typography, Tabs, Tab, Chip } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import ChatElement from '../../components/ChatElement';
import { useDispatch, useSelector } from 'react-redux';
import { ChatType, TabValueChannel } from '../../constants/commons-const';
import HomeSearch from '../../components/Search/HomeSearch';
import SkeletonChannels from '../../components/SkeletonChannels';
import FlipMove from 'react-flip-move';
import NoResult from '../../assets/Illustration/NoResult';

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
  const { activeChannels, loadingChannels, pinnedChannels, unreadChannels } = useSelector(state => state.channel);
  const [listTab, setListTab] = useState([
    { label: 'All', value: TabValueChannel.All, count: 0 },
    { label: 'Group', value: TabValueChannel.Group, count: 0 },
    { label: 'Unread', value: TabValueChannel.Unread, count: 0 },
  ]);
  const [tabSeledected, setTabSelected] = useState(TabValueChannel.All);

  useEffect(() => {
    setListTab([
      { label: 'All', value: TabValueChannel.All, count: 0 },
      {
        label: 'Group',
        value: TabValueChannel.Group,
        count: unreadChannels?.filter(c => c.type === ChatType.TEAM)?.length || 0,
      },
      {
        label: 'Unread',
        value: TabValueChannel.Unread,
        count: unreadChannels?.length || 0,
      },
    ]);
  }, [unreadChannels]);

  const renderedChannels = useMemo(() => {
    let displayChannels = [];
    let displayPinnedChannels = [];

    switch (tabSeledected) {
      case TabValueChannel.All:
        displayPinnedChannels = pinnedChannels || [];
        displayChannels = activeChannels || [];
        break;
      case TabValueChannel.Group:
        displayPinnedChannels = (pinnedChannels || []).filter(c => c.type === ChatType.TEAM);
        displayChannels = (activeChannels || []).filter(c => c.type === ChatType.TEAM);
        break;
      case TabValueChannel.Unread:
        displayPinnedChannels = (pinnedChannels || []).filter(c => {
          return unreadChannels.some(item => item.id === c.id);
        });
        displayChannels = (activeChannels || []).filter(c => {
          return unreadChannels.some(item => item.id === c.id);
        });
        break;
      default:
        displayPinnedChannels = [];
        displayChannels = [];
        break;
    }

    if (loadingChannels) {
      return <SkeletonChannels />;
    } else {
      return (
        <>
          {displayPinnedChannels.length > 0 && (
            <FlipMove duration={200}>
              {displayPinnedChannels.map(item => (
                <div className="channelItem" key={`pinned-${item.id}`}>
                  <ChatElement channel={item} />
                </div>
              ))}
            </FlipMove>
          )}

          {displayChannels.length > 0 && (
            <FlipMove duration={200}>
              {displayChannels.map(item => {
                return (
                  <div className="channelItem" key={`channel-${item.id}`}>
                    <ChatElement channel={item} />
                  </div>
                );
              })}
            </FlipMove>
          )}

          {displayChannels.length === 0 && displayPinnedChannels.length === 0 && (
            <Stack
              key="no-channels"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: '50px!important' }}
            >
              <NoResult width={180} height={180} />
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontSize: '16px',
                  color: theme.palette.text.primary,
                  marginTop: '15px',
                }}
              >
                No channels
              </Typography>
            </Stack>
          )}
        </>
      );
    }
  }, [activeChannels, pinnedChannels, loadingChannels, unreadChannels, tabSeledected, theme]);

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
      <Stack spacing={2}>
        <HomeSearch channels={activeChannels} />
        <StyledTabs
          value={tabSeledected}
          onChange={(event, newValue) => {
            setTabSelected(newValue);
          }}
          variant="scrollable"
        >
          {listTab.map((item, index) => {
            return (
              <Tab
                key={index}
                value={item.value}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{item.label}</span>
                    {item.value !== TabValueChannel.All && item.count > 0 && <Chip label={item.count} />}
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
          overflowY: 'auto',
          overflowX: 'hidden',
          marginLeft: '-15px!important',
          marginRight: '-15px!important',
          marginTop: '0px!important',
          padding: '15px',
          minHeight: 'auto',
          flex: 1,
        }}
      >
        <Stack spacing={2}>{renderedChannels}</Stack>
      </Stack>
    </Stack>
  );
};

export default Channels;
