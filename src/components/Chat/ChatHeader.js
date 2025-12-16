import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CaretLeft, MagnifyingGlass, Phone, VideoCamera } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { setSidebar, showSnackbar } from '../../redux/slices/app';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../ChannelAvatar';
import { handleError, isChannelDirect, myRoleInChannel } from '../../utils/commons';
import {
  AvatarShape,
  CallType,
  ChatType,
  ConfirmType,
  CurrentChannelStatus,
  RoleMember,
  SidebarMode,
  SidebarType,
} from '../../constants/commons-const';
import { LoadingButton } from '@mui/lab';
import { setCurrentChannel, setCurrentChannelStatus, SetIsGuest } from '../../redux/slices/channel';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { callClient, client } from '../../client';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import {
  DotsThreeIcon,
  EditIcon,
  InfoIcon,
  PauseCircleRedIcon,
  PinIcon,
  PlayCircleIcon,
  TrashIcon,
  UnPinIcon,
} from '../Icons';
import { setChannelConfirm } from '../../redux/slices/dialog';
import { SetOpenTopicPanel } from '../../redux/slices/topic';
import { useTranslation } from 'react-i18next';

const ActionsTopic = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { user_id } = useSelector(state => state.auth);
  const myRole = myRoleInChannel(currentChannel);

  const isTopicClosed = currentTopic?.data?.is_closed_topic;
  const isPinned = currentTopic?.data?.is_pinned;

  const onCloseTopic = useCallback(async () => {
    try {
      const topicCID = currentTopic?.cid;
      await currentChannel.closeTopic(topicCID);
      setAnchorEl(null);
      dispatch(showSnackbar({ message: t('chatHeader.snackbar_closed_success'), severity: 'success' }));
    } catch (error) {
      handleError(dispatch, error, t);
    }
  }, [currentChannel, currentTopic?.cid, dispatch, t]);

  const onReopenTopic = useCallback(async () => {
    try {
      const topicCID = currentTopic?.cid;
      await currentChannel.reopenTopic(topicCID);
      setAnchorEl(null);
      dispatch(showSnackbar({ message: t('chatHeader.snackbar_reopened_success'), severity: 'success' }));
    } catch (error) {
      handleError(dispatch, error, t);
    }
  }, [currentChannel, currentTopic?.cid, dispatch, t]);

  const onPinTopic = useCallback(async () => {
    try {
      if (isPinned) {
        await client.unpinChannel(ChatType.TOPIC, currentTopic?.id);
      } else {
        await client.pinChannel(ChatType.TOPIC, currentTopic?.id);
      }
    } catch (error) {
      handleError(dispatch, error, t);
    } finally {
      setAnchorEl(null);
    }
  }, [isPinned, currentTopic?.id, dispatch, t]);

  const onDeleteTopic = useCallback(() => {
    const payload = {
      openDialog: true,
      channel: currentTopic,
      userId: user_id,
      type: ConfirmType.DELETE_TOPIC,
    };

    dispatch(setChannelConfirm(payload));
    setAnchorEl(null);
  }, [currentTopic, user_id, dispatch]);

  const onOpenTopicInfo = useCallback(() => {
    dispatch(setSidebar({ type: SidebarType.TopicInfo, open: true }));
    setAnchorEl(null);
  }, [dispatch]);

  const onEditTopicInfo = useCallback(() => {
    dispatch(setSidebar({ type: SidebarType.TopicInfo, open: true, mode: SidebarMode.Edit }));
    setAnchorEl(null);
  }, [dispatch]);

  const ACTIONS = useMemo(
    () => [
      {
        value: isPinned ? 'unpin' : 'pin',
        label: isPinned ? t('chatHeader.unpin') : t('chatHeader.pin_to_top'),
        icon: isPinned ? (
          <UnPinIcon color={theme.palette.text.primary} />
        ) : (
          <PinIcon color={theme.palette.text.primary} />
        ),
        onClick: onPinTopic,
      },
      {
        value: 'info',
        label: t('chatHeader.topic_info'),
        icon: <InfoIcon color={theme.palette.text.primary} />,
        onClick: onOpenTopicInfo,
      },
      !isTopicClosed && {
        value: 'edit',
        label: t('chatHeader.edit_topic'),
        icon: <EditIcon color={theme.palette.text.primary} />,
        onClick: onEditTopicInfo,
        allowRoles: [RoleMember.OWNER, RoleMember.MOD],
      },
      {
        value: isTopicClosed ? 'reopen' : 'close',
        label: isTopicClosed ? t('chatHeader.reopen_topic') : t('chatHeader.close_topic'),
        icon: isTopicClosed ? (
          <PlayCircleIcon color={theme.palette.text.primary} />
        ) : (
          <PauseCircleRedIcon color={theme.palette.text.primary} />
        ),
        onClick: isTopicClosed ? onReopenTopic : onCloseTopic,
        allowRoles: [RoleMember.OWNER, RoleMember.MOD],
      },
      {
        value: 'delete',
        label: t('chatHeader.delete_topic'),
        icon: <TrashIcon color={theme.palette.error.main} />,
        onClick: onDeleteTopic,
        allowRoles: [RoleMember.OWNER],
      },
    ],
    [
      isPinned,
      isTopicClosed,
      theme.palette.text.primary,
      theme.palette.error.main,
      t,
      onPinTopic,
      onOpenTopicInfo,
      onEditTopicInfo,
      onReopenTopic,
      onCloseTopic,
      onDeleteTopic,
    ],
  );

  return (
    <>
      <IconButton
        onClick={event => {
          setAnchorEl(event.currentTarget);
        }}
      >
        <DotsThreeIcon color={theme.palette.text.primary} />
      </IconButton>

      <Popover
        id={Boolean(anchorEl) ? 'actions-topic-popover' : undefined}
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
          {ACTIONS.filter(Boolean)
            .filter(action => !action.allowRoles || action.allowRoles.includes(myRole))
            .map((action, index) => (
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
                <ListItemText
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: action.value === 'delete' ? theme.palette.error.main : theme.palette.text.primary,
                  }}
                  primary={action.label}
                />
              </MenuItem>
            ))}
        </MenuList>
      </Popover>
    </>
  );
};

const ChatHeader = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isMobileToMd = useResponsive('down', 'md');
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { isGuest, isBlocked, currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { sideBar } = useSelector(state => state.app);

  const isDirect = useMemo(() => isChannelDirect(currentChannel), [currentChannel]);
  const isEnabledTopics = useMemo(() => currentChannel?.data?.topics_enabled, [currentChannel?.data?.topics_enabled]);

  const [loadingJoin, setLoadingJoin] = useState(false);

  const members = useMemo(
    () => (isDirect ? Object.values(currentChannel.state.members) : []),
    [currentChannel, isDirect],
  );

  const otherMember = useMemo(() => members.find(member => member.user_id !== user_id), [members, user_id]);

  const otherMemberId = otherMember?.user_id;

  const onlineStatus = useOnlineStatus(isDirect ? otherMemberId : '');

  const onStartCall = useCallback(
    async callType => {
      await callClient.createCall(callType, currentChannel.cid);
    },
    [currentChannel?.cid],
  );

  const onStartVideoCall = useCallback(() => onStartCall(CallType.VIDEO), [onStartCall]);
  const onStartAudioCall = useCallback(() => onStartCall(CallType.AUDIO), [onStartCall]);

  const onOpenSearchMessage = useCallback(() => {
    dispatch(setSidebar({ type: SidebarType.SearchMessage, open: true }));
  }, [dispatch]);

  const onJoinChannel = useCallback(async () => {
    try {
      setLoadingJoin(true);
      const response = await currentChannel.acceptInvite('join');

      if (response) {
        setLoadingJoin(false);
        if (response.ermis_code) {
          dispatch(showSnackbar({ severity: 'error', message: response.message }));
        } else {
          // dispatch(FetchChannels());
          dispatch(SetIsGuest(false));
        }
      }
    } catch (error) {
      setLoadingJoin(false);
      handleError(dispatch, error, t);
    }
  }, [currentChannel, dispatch, t]);

  const renderName = useCallback(() => {
    if (isEnabledTopics) {
      if (currentTopic) {
        return currentTopic.data?.name;
      } else {
        return t('chatHeader.general');
      }
    } else {
      return currentChannel.data?.name;
    }
  }, [isEnabledTopics, currentTopic, currentChannel?.data?.name, t]);

  const renderCaption = useCallback(() => {
    if (isEnabledTopics || currentTopic) {
      return currentChannel.data?.name;
    } else {
      return isDirect ? onlineStatus : `${currentChannel.data?.member_count} ${t('chatHeader.member')}`;
    }
  }, [
    isEnabledTopics,
    currentTopic,
    currentChannel?.data?.name,
    currentChannel?.data?.member_count,
    isDirect,
    onlineStatus,
    t,
  ]);

  const renderIconAction = useCallback(() => {
    if (isGuest || isBlocked) return null;

    if (currentTopic?.type === ChatType.TOPIC) {
      return <ActionsTopic />;
    }
  }, [isGuest, isBlocked, currentTopic?.type]);

  const onNavigateBack = useCallback(() => {
    navigate(`${DEFAULT_PATH}`);
    dispatch(setCurrentChannel(null));
    dispatch(setCurrentChannelStatus(CurrentChannelStatus.IDLE));
    dispatch(SetOpenTopicPanel(false));
  }, [navigate, dispatch]);

  const onOpenChannelInfo = useCallback(() => {
    if (!isGuest) {
      if (sideBar && sideBar.open) {
        dispatch(setSidebar({ type: SidebarType.Channel, open: false, mode: '' }));
      } else {
        dispatch(setSidebar({ type: currentTopic ? SidebarType.TopicInfo : SidebarType.Channel, open: true }));
      }
    }
  }, [isGuest, sideBar, currentTopic, dispatch]);

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '65px',
          padding: '8px 16px',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          alignItems={'center'}
          direction={'row'}
          sx={{ width: '100%', height: '100%' }}
          justifyContent="space-between"
        >
          {currentChannel ? (
            <Stack spacing={1} direction="row" alignItems="center" sx={{ flex: 1, overflow: 'hidden' }}>
              {isMobileToMd && (
                <IconButton onClick={onNavigateBack}>
                  <CaretLeft />
                </IconButton>
              )}

              <ChannelAvatar
                channel={currentTopic ? currentTopic : currentChannel}
                width={isEnabledTopics || currentTopic ? 40 : 60}
                height={isEnabledTopics || currentTopic ? 40 : 60}
                openLightbox={true}
                shape={AvatarShape.Round}
                showGeneralDefault={true}
              />

              <Box
                sx={{
                  overflow: 'hidden',
                  flex: 1,
                }}
              >
                <Button
                  onClick={onOpenChannelInfo}
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {renderName()}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.text.secondary,
                        fontSize: '12px',
                        fontWeight: 400,
                      }}
                    >
                      {renderCaption()}
                    </Typography>
                  </Typography>
                </Button>
              </Box>
            </Stack>
          ) : (
            <span>&nbsp;</span>
          )}

          <Stack direction={'row'} alignItems="center" spacing={isMobileToMd ? 1 : 2}>
            {isDirect && (
              <>
                <IconButton onClick={onStartVideoCall} disabled={isBlocked}>
                  <VideoCamera color={theme.palette.text.primary} />
                </IconButton>
                <IconButton onClick={onStartAudioCall} disabled={isBlocked}>
                  <Phone color={theme.palette.text.primary} />
                </IconButton>
              </>
            )}

            {!isGuest && (
              <IconButton onClick={onOpenSearchMessage} disabled={isBlocked}>
                <MagnifyingGlass color={theme.palette.text.primary} />
              </IconButton>
            )}

            {renderIconAction()}

            {isGuest && (
              <LoadingButton variant="contained" onClick={onJoinChannel} loading={loadingJoin}>
                {t('chatHeader.join')}
              </LoadingButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default ChatHeader;
