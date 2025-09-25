import { useEffect, useState } from 'react';
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
import { handleError, isChannelDirect, myRoleInChannel } from '../utils/commons';
import { setChannelConfirm } from '../redux/slices/dialog';

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
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileToMd = useResponsive('down', 'md');
  const { currentChannel, unreadChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const [isRightClick, setIsRightClick] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [lastMessage, setLastMessage] = useState('');
  const [lastMessageAt, setLastMessageAt] = useState('');

  const users = client.state.users ? Object.values(client.state.users) : [];
  const topicId = topic?.id || '';
  const isPinned = topic.data?.is_pinned;
  const openMenu = Boolean(anchorEl);
  const myRole = myRoleInChannel(currentChannel);
  const showItemDeleteTopic = [RoleMember.OWNER].includes(myRole);

  const replaceMentionsWithNames = inputValue => {
    users.forEach(user => {
      inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
    });
    return inputValue;
  };

  const getLastMessage = message => {
    if (message) {
      const date = message.updated_at ? message.updated_at : message.created_at;
      const sender = message.user;
      const senderId = sender?.id;
      const isMe = user_id === senderId;
      const senderName = isMe ? 'You' : sender?.name || senderId;
      setLastMessageAt(getDisplayDate(date));
      if (message.type === MessageType.System) {
        const messageSystem = convertMessageSystem(message.text, users, false);
        setLastMessage(`${senderName}: ${messageSystem}`);
      } else if (message.type === MessageType.Signal) {
        const messageSignal = convertMessageSignal(message.text);
        setLastMessage(messageSignal.text || '');
      } else if (message.type === MessageType.Sticker) {
        setLastMessage(`${senderName}: Sticker`);
      } else {
        if (message.attachments) {
          const attachmentLast = message.attachments[message.attachments.length - 1];

          const isLinkPreview = attachmentLast.type === 'linkPreview';
          const isImage = attachmentLast.type === 'image';
          const isVideo = attachmentLast.type === 'video';

          if (isImage) {
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
                {attachmentLast.title || 'Photo'}
              </>,
            );
          } else if (isVideo) {
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
          } else {
            setLastMessage(`${senderName}: ${isLinkPreview ? attachmentLast.link_url : attachmentLast.title}`);
          }
        } else {
          const messagePreview = replaceMentionsWithNames(message.text);
          setLastMessage(`${senderName}: ${messagePreview}`);
        }
      }
    } else {
      setLastMessageAt(getDisplayDate(topic.data.created_at));
      setLastMessage('No messages here yet');
    }
  };

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
  }, [topic, user_id, users.length]);

  const onLeftClick = () => {
    if (!isRightClick) {
      navigate(`${DEFAULT_PATH}/${currentChannel?.cid}?topicId=${topicId}`);
      dispatch(onReplyMessage(null));
      dispatch(onEditMessage(null));
    }
    setAnchorEl(null);
  };

  const onRightClick = event => {
    event.preventDefault();
    setIsRightClick(true);
    setAnchorEl(event.currentTarget);
    setSelectedTopic(topic);
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
    setIsRightClick(false);
    setSelectedTopic(null);
  };

  const onPinTopic = async () => {
    try {
      if (selectedTopic?.data?.is_pinned) {
        await client.unpinChannel(ChatType.TOPIC, selectedTopic?.id);
      } else {
        await client.pinChannel(ChatType.TOPIC, selectedTopic?.id);
      }
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setAnchorEl(null);
    }
  };
  const onDeleteTopic = () => {
    const payload = {
      openDialog: true,
      channel: selectedTopic,
      userId: user_id,
      type: ConfirmType.DELETE_TOPIC,
    };

    dispatch(setChannelConfirm(payload));
    setAnchorEl(null);
  };

  const hasUnread = (() => {
    if (!unreadChannels) return false;
    // Tìm channel chứa topic này
    const channel = unreadChannels.find(ch => ch.id === currentChannel?.id);
    if (!channel || !channel.unreadTopics) return false;
    // Tìm topic trong channel
    const topicUnread = channel.unreadTopics.find(tp => tp.id === topicId);
    return topicUnread && topicUnread.unreadCount > 0;
  })();

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
        {isMobileToMd ? (
          <Tooltip title={topic.data?.name} placement="right">
            <Box sx={{ position: 'relative', width: 40, height: 40 }}>
              {hasUnread ? (
                <Badge
                  variant="dot"
                  color="error"
                  sx={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    zIndex: 2,
                  }}
                />
              ) : null}
              <TopicAvatar
                url={topic.data?.image || ''}
                name={topic.data?.name || ''}
                size={40}
                shape={AvatarShape.Round}
              />
            </Box>
          </Tooltip>
        ) : (
          <>
            {/* -------------------------------avatar------------------------------- */}
            <TopicAvatar
              url={topic.data?.image || ''}
              name={topic.data?.name || ''}
              size={40}
              shape={AvatarShape.Round}
            />

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
          </>
        )}
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
          {isPinned ? 'Unpin from top' : 'Pin to top'}
        </MenuItem>

        {/* --------------------Delete Topic---------------- */}
        {showItemDeleteTopic && (
          <MenuItem sx={{ color: theme.palette.error.main }} onClick={onDeleteTopic}>
            <Trash color={theme.palette.error.main} />
            Delete Topic
          </MenuItem>
        )}
      </StyledMenu>
    </>
  );
};

export default TopicElement;
