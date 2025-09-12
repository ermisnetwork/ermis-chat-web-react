import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  Typography,
  Box,
  styled,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { myRoleInChannel, splitChannelId } from '../../utils/commons';
import { AvatarShape, ChatType, RoleMember, SidebarType } from '../../constants/commons-const';
import { DotsThreeIcon, InfoIcon, ProfileAddIcon, SearchIcon, StickyNoteIcon } from '../../components/Icons';
import ChannelAvatar from '../../components/ChannelAvatar';
import NoTopic from '../../assets/Illustration/NoTopic';
import GeneralElement from '../../components/GeneralElement';
import NewTopicDialog from '../../sections/dashboard/NewTopicDialog';
import { SetOpenInviteFriendDialog, SetOpenNewTopicDialog } from '../../redux/slices/dialog';
import FlipMove from 'react-flip-move';
import TopicElement from '../../components/TopicElement';
import { ClientEvents } from '../../constants/events-const';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AddPinnedTopic,
  AddTopic,
  ConnectCurrentTopic,
  RemovePinnedTopic,
  RemoveTopic,
  SetCurrentTopic,
  SetOpenTopicPanel,
} from '../../redux/slices/topic';
import { setSidebar } from '../../redux/slices/app';
import { DEFAULT_PATH } from '../../config';
import SkeletonChannels from '../../components/SkeletonChannels';
import { client } from '../../client';
import useResponsive from '../../hooks/useResponsive';
import HomeSearch from '../../components/Search/HomeSearch';
import { X } from 'phosphor-react';

const StyledTopicItem = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  margin: '0px -15px',
  padding: '5px 10px',
}));

const TopicEmpty = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobileToMd = useResponsive('down', 'md');
  const { currentChannel } = useSelector(state => state.channel);
  const myRole = myRoleInChannel(currentChannel);

  if (isMobileToMd) return null;
  return (
    <Stack sx={{ flex: 1, width: '100%', minHeight: 'auto', alignItems: 'center', justifyContent: 'center' }}>
      <NoTopic />
      <Typography
        variant="subtitle2"
        sx={{
          textAlign: 'center',
          fontSize: 16,
          color: theme.palette.text.primary,
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        Topic Is Waiting!
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{
          textAlign: 'center',
          fontSize: 14,
          color: theme.palette.text.secondary,
          fontWeight: 400,
        }}
      >
        We moved older messages to “General.” Kick off a new topic anytime!
      </Typography>

      {[RoleMember.OWNER, RoleMember.MOD].includes(myRole) && (
        <Button
          variant="contained"
          size="large"
          sx={{ marginTop: 3, width: '200px' }}
          onClick={() => {
            dispatch(SetOpenNewTopicDialog(true));
          }}
        >
          NEW TOPIC
        </Button>
      )}
    </Stack>
  );
};

const TopicHeader = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobileToMd = useResponsive('down', 'md');
  const { currentChannel, isGuest } = useSelector(state => state.channel);

  const [anchorEl, setAnchorEl] = useState(null);
  const myRole = myRoleInChannel(currentChannel);

  const ACTIONS = [
    {
      label: 'Channel Info',
      icon: <InfoIcon color={theme.palette.text.primary} />,
      onClick: () => {
        setAnchorEl(null);
        dispatch(setSidebar({ type: SidebarType.Channel, open: true }));
      },
    },
    {
      label: 'Search Messages',
      icon: <SearchIcon color={theme.palette.text.primary} />,
      onClick: () => {
        setAnchorEl(null);
        dispatch(setSidebar({ type: SidebarType.SearchMessage, open: true }));
        dispatch(SetCurrentTopic(null));
        navigate(`${DEFAULT_PATH}/${currentChannel.cid}`);
      },
    },
    {
      label: 'Add Members',
      icon: <ProfileAddIcon color={theme.palette.text.primary} />,
      onClick: () => {
        setAnchorEl(null);
        dispatch(SetOpenInviteFriendDialog(true));
      },
    },
    {
      label: 'New Topic',
      icon: <StickyNoteIcon color={theme.palette.text.primary} />,
      onClick: () => {
        setAnchorEl(null);
        dispatch(SetOpenNewTopicDialog(true));
      },
      allowRoles: [RoleMember.OWNER, RoleMember.MOD],
    },
  ];

  const onOpenPopover = event => {
    if (isMobileToMd) {
      setAnchorEl(event.currentTarget);
    }
  };

  const onCloseTopicPanel = () => {
    dispatch(SetOpenTopicPanel(false));
  };

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      spacing={1}
      sx={{
        width: '100%',
        height: '74px',
        padding: '8px 6px',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {!isMobileToMd && (
        <IconButton onClick={onCloseTopicPanel}>
          <X size={20} color={theme.palette.text.primary} />
        </IconButton>
      )}

      <Box sx={{ width: '60px', height: '60px' }} onClick={onOpenPopover}>
        <ChannelAvatar channel={currentChannel} width={60} height={60} openLightbox={true} shape={AvatarShape.Round} />
      </Box>

      {!isMobileToMd && (
        <>
          <Box
            sx={{
              overflow: 'hidden',
              flex: 1,
              minWidth: 'auto',
            }}
          >
            <Button
              onClick={() => {
                if (!isGuest) {
                  dispatch(setSidebar({ type: SidebarType.Channel, open: true }));
                }
              }}
              sx={{
                textTransform: 'none',
                maxWidth: '100%',
                minWidth: 'auto',
                justifyContent: 'start',
                textAlign: 'left',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  overflow: 'hidden',
                }}
              >
                {currentChannel.data?.name}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: theme.palette.text.secondary,
                    fontSize: '12px',
                    fontWeight: 400,
                  }}
                >
                  {`${currentChannel.data?.member_count} members`}
                </Typography>
              </Typography>
            </Button>
          </Box>

          <IconButton
            onClick={event => {
              setAnchorEl(event.currentTarget);
            }}
          >
            <DotsThreeIcon color={theme.palette.text.primary} />
          </IconButton>
        </>
      )}

      <Popover
        id={Boolean(anchorEl) ? 'actions-channel-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuList sx={{ width: '210px' }}>
          {ACTIONS.filter(action => !action.allowRoles || action.allowRoles.includes(myRole)).map((action, index) => (
            <MenuItem
              key={index}
              onClick={action.onClick}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto!important', marginRight: '8px' }}>{action.icon}</ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} primary={action.label} />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </Stack>
  );
};

const TopicPanel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic, topics, loadingTopics, pinnedTopics, openTopicPanel } = useSelector(state => state.topic);
  const { openHomeSearch } = useSelector(state => state.app);
  const [searchParams, setSearchParams] = useSearchParams();
  const topicID = searchParams.get('topicId');
  const [idSelected, setIdSelected] = useState('');
  const isMobileToMd = useResponsive('down', 'md');

  useEffect(() => {
    const handleTopicCreated = event => {
      const splitParentCID = splitChannelId(event.parent_cid);
      const parentChannelId = splitParentCID.channelId;

      if (parentChannelId === currentChannel?.id) {
        dispatch(AddTopic(event.channel_id));
      }
    };

    const handleTopicPinned = event => {
      const splitParentCID = splitChannelId(event.parent_cid);
      const parentChannelId = splitParentCID.channelId;

      if (parentChannelId === currentChannel?.id && event.channel_type === ChatType.TOPIC) {
        dispatch(AddPinnedTopic(event.channel_id));
      }
    };

    const handleTopicUnPinned = event => {
      const splitParentCID = splitChannelId(event.parent_cid);
      const parentChannelId = splitParentCID.channelId;

      if (parentChannelId === currentChannel?.id && event.channel_type === ChatType.TOPIC) {
        dispatch(RemovePinnedTopic(event.channel_id));
      }
    };

    const handleTopicDeleted = event => {
      if (event.channel_type === ChatType.TOPIC) {
        dispatch(RemovePinnedTopic(event.channel_id));
        dispatch(RemoveTopic(event.channel_id));
        if (currentTopic?.id === event.channel_id) {
          dispatch(SetCurrentTopic(null));
          setIdSelected(currentChannel?.id);
          searchParams.delete('topicId');
          setSearchParams(searchParams, { replace: true });
        }
      }
    };

    client.on(ClientEvents.ChannelTopicCreated, handleTopicCreated);
    client.on(ClientEvents.ChannelPinned, handleTopicPinned);
    client.on(ClientEvents.ChannelUnPinned, handleTopicUnPinned);
    client.on(ClientEvents.ChannelDeleted, handleTopicDeleted);

    return () => {
      client.off(ClientEvents.ChannelTopicCreated, handleTopicCreated);
      client.off(ClientEvents.ChannelPinned, handleTopicPinned);
      client.off(ClientEvents.ChannelUnPinned, handleTopicUnPinned);
      client.off(ClientEvents.ChannelDeleted, handleTopicDeleted);
    };
  }, [client, currentTopic, currentChannel]);

  useEffect(() => {
    if (topicID) {
      dispatch(ConnectCurrentTopic(topicID));
      setIdSelected(topicID);
    } else {
      dispatch(SetCurrentTopic(null));
      setIdSelected(currentChannel.id);
    }
  }, [topicID, currentChannel]);

  const renderedTopics = useMemo(() => {
    if (loadingTopics) {
      return <SkeletonChannels />;
    } else {
      return (
        <>
          <StyledTopicItem>
            <GeneralElement idSelected={idSelected} />
          </StyledTopicItem>

          {pinnedTopics.length > 0 && (
            <FlipMove duration={200}>
              {pinnedTopics.map(item => {
                return (
                  <StyledTopicItem key={`pinned-topic-${item.id}`}>
                    <TopicElement topic={item} idSelected={idSelected} />
                  </StyledTopicItem>
                );
              })}
            </FlipMove>
          )}

          {topics.length > 0 ? (
            <FlipMove duration={200}>
              {topics.map(item => {
                return (
                  <StyledTopicItem key={`topic-${item.id}`}>
                    <TopicElement topic={item} idSelected={idSelected} />
                  </StyledTopicItem>
                );
              })}
            </FlipMove>
          ) : (
            <TopicEmpty />
          )}
        </>
      );
    }
  }, [topics, idSelected, loadingTopics, pinnedTopics]);

  if (!currentChannel?.data?.topics_enabled || !openTopicPanel) return null;

  return (
    <>
      <Stack
        sx={{
          width: isMobileToMd ? '73px' : '300px',
          height: '100%',
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {openHomeSearch ? (
          <Box sx={{ padding: '15px', width: '100%', height: '100%', position: 'relative' }}>
            <HomeSearch />
          </Box>
        ) : (
          <>
            <TopicHeader />

            <Stack
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 'auto',
                padding: '0 15px',
              }}
              className="customScrollbar"
            >
              {renderedTopics}
            </Stack>
          </>
        )}
      </Stack>

      <NewTopicDialog />
    </>
  );
};

export default TopicPanel;
