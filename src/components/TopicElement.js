import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Stack, Tooltip, Typography, Menu, MenuItem } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { ClientEvents } from '../constants/events-const';
import { onEditMessage, onReplyMessage } from '../redux/slices/messages';
import { Play, PushPin, PushPinSlash, Trash } from 'phosphor-react';
import { AvatarShape, MessageType, ConfirmType, RoleMember, ChatType } from '../constants/commons-const';
import { convertMessageSystem } from '../utils/messageSystem';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import { convertMessageSignal } from '../utils/messageSignal';
import { getDisplayDate } from '../utils/formatTime';
import { client } from '../client';
import TopicAvatar from './TopicAvatar';
import useResponsive from '../hooks/useResponsive';
import { handleError, myRoleInChannel } from '../utils/commons';
import { setChannelConfirm } from '../redux/slices/dialog';
import { useTranslation } from 'react-i18next';

const StyledTopicItem = styled(Box)(({ theme }) => ({
  // width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  padding: '6px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
}));
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& svg': {
        marginRight: '10px',
        width: '18px',
        height: '18px',
        fill: theme.palette.text.secondary,
      },
    },
  },
}));

const TopicElement = ({ topic, idSelected }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileToMd = useResponsive('down', 'md');
  const { unreadChannels = [] } = useSelector(state => state.channel);
  const { parentChannel } = useSelector(state => state.topic);
  const { user_id } = useSelector(state => state.auth);
  const [isRightClick, setIsRightClick] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [lastMessage, setLastMessage] = useState('');
  const [lastMessageAt, setLastMessageAt] = useState('');

  // Memoize users array để tránh tạo mới mỗi render
  const users = useMemo(() => {
    return client.state.users ? Object.values(client.state.users) : [];
  }, [client.state.users]);

  // Memoize derived states để tránh tính toán lại
  const topicId = useMemo(() => topic?.id || '', [topic?.id]);
  const isPinned = useMemo(() => topic.data?.is_pinned, [topic.data?.is_pinned]);
  const openMenu = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const myRole = useMemo(() => myRoleInChannel(parentChannel), [parentChannel]);
  const showItemDeleteTopic = useMemo(() => [RoleMember.OWNER].includes(myRole), [myRole]);

  const replaceMentionsWithNames = useCallback(
    inputValue => {
      users.forEach(user => {
        inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
      });
      return inputValue;
    },
    [users],
  );

  const getLastMessage = useCallback(
    message => {
      if (!message) {
        setLastMessageAt(getDisplayDate(topic.data.created_at));
        setLastMessage(t('topicElement.no_message'));
        return;
      }

      const date = message.updated_at || message.created_at;
      const sender = message.user;
      const senderId = sender?.id;
      const isMe = user_id === senderId;
      const senderName = isMe ? t('chatElement.you') : sender?.name || senderId;

      setLastMessageAt(getDisplayDate(date));

      switch (message.type) {
        case MessageType.System: {
          const messageSystem = convertMessageSystem(message.text, users, false, false, t);
          setLastMessage(`${senderName}: ${messageSystem}`);
          break;
        }

        case MessageType.Signal: {
          const messageSignal = convertMessageSignal(message.text, t);
          setLastMessage(messageSignal.text || '');
          break;
        }

        case MessageType.Sticker: {
          setLastMessage(`${senderName}: ${t('chatElement.sticker')}`);
          break;
        }

        default: {
          if (message.attachments && message.attachments.length > 0) {
            const attachmentLast = message.attachments[message.attachments.length - 1];

            switch (attachmentLast.type) {
              case 'image': {
                setLastMessage(
                  <>
                    {`${senderName}:`}
                    <img
                      src={attachmentLast.image_url}
                      alt={attachmentLast.title || 'image'}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '5px',
                        display: 'inline-block',
                        verticalAlign: 'top',
                        margin: '0px 4px',
                      }}
                    />
                    {attachmentLast.title || t('chatElement.photo')}
                  </>,
                );
                break;
              }

              case 'video': {
                setLastMessage(
                  <>
                    {`${senderName}:`}
                    <span style={{ position: 'relative', display: 'inline-block', margin: '0px 4px' }}>
                      <img
                        src={attachmentLast.thumb_url}
                        alt={attachmentLast.title || 'video'}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '5px',
                          display: 'inline-block',
                          verticalAlign: 'top',
                        }}
                      />
                      <Play
                        size={10}
                        color="#fff"
                        weight="fill"
                        style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                      />
                    </span>
                    {attachmentLast.title || 'Video'}
                  </>,
                );
                break;
              }

              case 'linkPreview': {
                setLastMessage(`${senderName}: ${attachmentLast.link_url}`);
                break;
              }

              default: {
                setLastMessage(`${senderName}: ${attachmentLast.title}`);
                break;
              }
            }
          } else {
            const messagePreview = replaceMentionsWithNames(message.text);
            setLastMessage(`${senderName}: ${messagePreview}`);
          }
          break;
        }
      }
    },
    [user_id, users, t, replaceMentionsWithNames, topic.data.created_at],
  );

  useEffect(() => {
    const lastMsg = topic.state.messages.length > 0 ? topic.state.messages[topic.state.messages.length - 1] : null;
    getLastMessage(lastMsg);

    const handleMessageNew = event => {
      if (event.channel_id === topic.data.id) {
        if (!(event.message.type === MessageType.Signal && ['1', '4'].includes(event.message.text[0]))) {
          // không cần hiển thị last message với AudioCallStarted (1) hoặc VideoCallStarted (4) khi có cuộc gọi
          getLastMessage(event.message);
        }
      }
    };

    const handleMessageUpdated = event => {
      if (event.channel_id === topic.data.id) {
        const lastMsg = topic.state.messages.length > 0 ? topic.state.messages[topic.state.messages.length - 1] : null;
        getLastMessage(lastMsg);
      }
    };

    const handleMessageDeleted = event => {
      if (event.channel_id === topic.data.id) {
        const lastMsg = topic.state.messages.length > 0 ? topic.state.messages[topic.state.messages.length - 1] : null;
        getLastMessage(lastMsg);
      }
    };

    client.on(ClientEvents.MessageNew, handleMessageNew);
    client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
    client.on(ClientEvents.MessageDeleted, handleMessageDeleted);
    return () => {
      client.off(ClientEvents.MessageNew, handleMessageNew);
      client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.off(ClientEvents.MessageDeleted, handleMessageDeleted);
    };
  }, [topic, user_id, getLastMessage]);

  const onLeftClick = useCallback(() => {
    if (!isRightClick) {
      navigate(`${DEFAULT_PATH}/${parentChannel?.cid}?topicId=${topicId}`);
      dispatch(onReplyMessage(null));
      dispatch(onEditMessage(null));
    }
    setAnchorEl(null);
  }, [isRightClick, navigate, parentChannel?.cid, topicId, dispatch]);

  const onRightClick = useCallback(
    event => {
      event.preventDefault();
      setIsRightClick(true);
      setAnchorEl(event.currentTarget);
      setSelectedTopic(topic);
    },
    [topic],
  );

  const onCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setIsRightClick(false);
    setSelectedTopic(null);
  }, []);

  const onPinTopic = useCallback(async () => {
    try {
      if (selectedTopic?.data?.is_pinned) {
        await client.unpinChannel(ChatType.TOPIC, selectedTopic?.id);
      } else {
        await client.pinChannel(ChatType.TOPIC, selectedTopic?.id);
      }
    } catch (error) {
      handleError(dispatch, error, t);
    } finally {
      setAnchorEl(null);
    }
  }, [selectedTopic, dispatch, t]);

  const onDeleteTopic = useCallback(() => {
    const payload = {
      openDialog: true,
      channel: selectedTopic,
      userId: user_id,
      type: ConfirmType.DELETE_TOPIC,
    };

    dispatch(setChannelConfirm(payload));
    setAnchorEl(null);
  }, [selectedTopic, user_id, dispatch]);

  const hasUnread = useMemo(() => {
    if (!unreadChannels) return false;
    // Tìm channel chứa topic này
    const channel = unreadChannels.find(ch => ch.id === parentChannel?.id);
    if (!channel || !channel.unreadTopics) return false;
    // Tìm topic trong channel
    const topicUnread = channel.unreadTopics.find(tp => tp.id === topicId);
    return topicUnread && topicUnread.unreadCount > 0;
  }, [unreadChannels, parentChannel?.id, topicId]);

  return (
    <>
      <StyledTopicItem
        onClick={onLeftClick}
        onContextMenu={onRightClick}
        sx={{
          backgroundColor:
            idSelected === topicId ? `${alpha(theme.palette.primary.main, 0.1)} !important` : 'transparent',
        }}
        gap={1}
      >
        {/* -------------------------------avatar------------------------------- */}
        <TopicAvatar url={topic.data?.image || ''} name={topic.data?.name || ''} size={40} shape={AvatarShape.Round} />

        {/* -------------------------------content------------------------------- */}
        <Box sx={{ flex: 1, minWidth: 'auto', overflow: 'hidden' }}>
          {/* -------------------------------topic name------------------------------- */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography
              variant="subtitle2"
              sx={{
                flex: 1,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
              }}
            >
              {topic.data.name}
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1}>
              {isPinned && <PushPin size={14} color={theme.palette.primary.main} weight="fill" />}

              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  minWidth: 'auto',
                  flex: 1,
                  overflow: 'hidden',
                  fontSize: '10px',
                }}
                variant="caption"
              >
                {lastMessageAt}
              </Typography>
            </Stack>
          </Stack>

          {/* -------------------------------last message------------------------------- */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Typography
              variant="caption"
              sx={{
                color: hasUnread ? 'inherit' : theme.palette.text.secondary,
                flex: 1,
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
                display: 'block',
                fontWeight: hasUnread ? 600 : 400,
              }}
            >
              {lastMessage}
            </Typography>

            {hasUnread ? <Badge variant="dot" color="error" sx={{ margin: '0 10px 0 15px' }} /> : null}
          </Stack>
        </Box>
      </StyledTopicItem>
      <StyledMenu
        anchorEl={anchorEl}
        open={openMenu}
        elevation={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClose={onCloseMenu}
        onClick={onCloseMenu}
      >
        {/* --------------------Pin/Unpin Topic---------------- */}
        <MenuItem onClick={onPinTopic}>
          {isPinned ? <PushPinSlash /> : <PushPin />}
          {isPinned ? t('topicElement.unpinned') : t('topicElement.pinned')}
        </MenuItem>

        {/* --------------------Delete Topic---------------- */}
        {showItemDeleteTopic && (
          <MenuItem sx={{ color: theme.palette.error.main }} onClick={onDeleteTopic}>
            <Trash color={theme.palette.error.main} />
            {t('topicElement.delete_topic')}
          </MenuItem>
        )}
      </StyledMenu>
    </>
  );
};

export default TopicElement;
