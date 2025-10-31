import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Typography, Tabs, Tab, Chip, Button } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import ChatElement from '../../components/ChatElement';
import { useDispatch, useSelector } from 'react-redux';
import { ChatType, TabValueChannel } from '../../constants/commons-const';
import HomeSearch from '../../components/Search/HomeSearch';
import SkeletonChannels from '../../components/SkeletonChannels';
import FlipMove from 'react-flip-move';
import NoResult from '../../assets/Illustration/NoResult';
import { SetOpenHomeSearch } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';
import { TRANSITION } from '../../config';

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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { activeChannels, loadingChannels, pinnedChannels, unreadChannels, currentChannel } = useSelector(
    state => state.channel,
  );
  const { openHomeSearch } = useSelector(state => state.app);
  const { openTopicPanel } = useSelector(state => state.topic);

  const [tabSeledected, setTabSelected] = useState(TabValueChannel.All);

  const listTab = useMemo(
    () => [
      { label: t('channelList.all'), value: TabValueChannel.All, count: 0 },
      {
        label: t('channelList.group'),
        value: TabValueChannel.Group,
        count: unreadChannels?.filter(c => c.type === ChatType.TEAM)?.length || 0,
      },
      {
        label: t('channelList.unread'),
        value: TabValueChannel.Unread,
        count: unreadChannels?.length || 0,
      },
    ],
    [unreadChannels, t],
  );

  const isEnabledTopics = useMemo(() => {
    return currentChannel?.data?.topics_enabled && openTopicPanel;
  }, [currentChannel?.data?.topics_enabled, openTopicPanel]);

  const filteredPinnedChannels = useMemo(() => {
    switch (tabSeledected) {
      case TabValueChannel.All:
        return pinnedChannels || [];
      case TabValueChannel.Group:
        return (pinnedChannels || []).filter(c => c.type === ChatType.TEAM);
      case TabValueChannel.Unread:
        return (pinnedChannels || []).filter(c => {
          return unreadChannels.some(item => item.id === c.id);
        });
      default:
        return [];
    }
  }, [pinnedChannels, tabSeledected, unreadChannels]);

  const filteredActiveChannels = useMemo(() => {
    switch (tabSeledected) {
      case TabValueChannel.All:
        return activeChannels || [];
      case TabValueChannel.Group:
        return (activeChannels || []).filter(c => c.type === ChatType.TEAM);
      case TabValueChannel.Unread:
        return (activeChannels || []).filter(c => {
          return unreadChannels.some(item => item.id === c.id);
        });
      default:
        return [];
    }
  }, [activeChannels, tabSeledected, unreadChannels]);

  const renderedChannels = useMemo(() => {
    if (loadingChannels) {
      return <SkeletonChannels />;
    } else {
      return (
        <>
          {filteredPinnedChannels.length > 0 && (
            <FlipMove style={{ marginBottom: '6px' }} duration={200}>
              {filteredPinnedChannels.map(item => (
                <div className="channelItem" key={`pinned-${item.id}`}>
                  <ChatElement channel={item} />
                </div>
              ))}
            </FlipMove>
          )}

          {filteredActiveChannels.length > 0 && (
            <FlipMove duration={200}>
              {filteredActiveChannels.map(item => {
                return (
                  <div className="channelItem" key={`channel-${item.id}`}>
                    <ChatElement channel={item} />
                  </div>
                );
              })}
            </FlipMove>
          )}

          {filteredActiveChannels.length === 0 && filteredPinnedChannels.length === 0 && (
            <Stack
              key="no-channels"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: '50px!important' }}
            >
              <NoResult width={isEnabledTopics ? 80 : 180} height={isEnabledTopics ? 80 : 180} />
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontSize: isEnabledTopics ? '10px' : '16px',
                  color: theme.palette.text.primary,
                  marginTop: '15px',
                }}
              >
                {t('channelList.no_channel')}
              </Typography>
            </Stack>
          )}
        </>
      );
    }
  }, [filteredPinnedChannels, filteredActiveChannels, loadingChannels, theme, isEnabledTopics, t]);

  const onToggleHomeSearch = useCallback(() => {
    dispatch(SetOpenHomeSearch(!openHomeSearch));
  }, [dispatch, openHomeSearch]);

  const handleTabChange = useCallback((event, newValue) => {
    setTabSelected(newValue);
  }, []);

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
      <Stack spacing={2}>
        <HomeSearch />

        <StyledTabs
          value={tabSeledected}
          onChange={handleTabChange}
          variant="standard"
          sx={{
            transition: TRANSITION,
            opacity: openTopicPanel ? 0.5 : 1,
            pointerEvents: openTopicPanel ? 'none' : 'auto',
          }}
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
        className={`customScrollbar ${openTopicPanel ? 'noScrollBar' : ''}`}
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
