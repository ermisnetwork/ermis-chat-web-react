import React, { useEffect, useState } from 'react';
import { Badge, Box, Stack, Typography, Menu, MenuItem } from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import {
  AddUnreadChannel,
  RemoveUnreadChannel,
  SetMarkReadChannel,
  UpdateUnreadChannel,
} from '../redux/slices/channel';
import ChannelAvatar from './ChannelAvatar';
import { isChannelDirect, isPublicChannel, myRoleInChannel } from '../utils/commons';
import { ClientEvents } from '../constants/events-const';
import { onEditMessage, onReplyMessage } from '../redux/slices/messages';
import { EnvelopeSimpleOpen, Play, PushPin, PushPinSlash, SignOut, Trash } from 'phosphor-react';
import { AvatarShape, ConfirmType, MessageType, RoleMember } from '../constants/commons-const';
import { setChannelConfirm } from '../redux/slices/dialog';
import { convertMessageSystem } from '../utils/messageSystem';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import AvatarComponent from './AvatarComponent';
import { convertMessageSignal } from '../utils/messageSignal';
import { getDisplayDate } from '../utils/formatTime';
import { client } from '../client';
import { SpearkerOffIcon } from './Icons';

const StyledChatBox = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
    '& .optionsMore': {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    '& .optionsNoti': {
      display: 'none',
    },
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

const ChatElement = ({ channel }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentChannel, mutedChannels, unreadChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const users = client.state.users ? Object.values(client.state.users) : [];
  const channelId = channel?.id || '';
  const channelType = channel?.type || '';
  const isDirect = isChannelDirect(channel);
  const myRole = myRoleInChannel(channel);
  const isPublic = isPublicChannel(channel);
  const isPinned = channel.data.is_pinned;

  const [lastMessage, setLastMessage] = useState('');
  const [count, setCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [isRightClick, setIsRightClick] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState('');

  const showItemLeaveChannel = !isDirect && [RoleMember.MOD, RoleMember.MEMBER].includes(myRole);
  const showItemDeleteChannel = !isDirect && [RoleMember.OWNER].includes(myRole);
  const showItemDeleteConversation = isDirect;

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
        const messageSystem = convertMessageSystem(message.text, users, isDirect);
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
      setLastMessageAt(getDisplayDate(channel.data.created_at));
      setLastMessage('No messages here yet');
    }
  };

  useEffect(() => {
    const lastMsg =
      channel.state.messages.length > 0 ? channel.state.messages[channel.state.messages.length - 1] : null;
    getLastMessage(lastMsg);

    const membership = channel.state.membership;
    const blocked = membership?.blocked ?? false;
    setIsBlocked(blocked);
    setCount(channel.state.unreadCount);

    const handleMessageNew = event => {
      if (event.channel_id === channel.data.id) {
        setCount(event.unread_count);

        if (!(event.message.type === MessageType.Signal && ['1', '4'].includes(event.message.text[0]))) {
          // không cần hiển thị last message với AudioCallStarted (1) hoặc VideoCallStarted (4) khi có cuộc gọi
          getLastMessage(event.message);
        }

        if (event.user.id !== user_id && unreadChannels) {
          const existingChannel = unreadChannels.find(item => item.id === event.channel_id);
          dispatch(
            existingChannel && event.unread_count > 0
              ? UpdateUnreadChannel(event.channel_id, event.unread_count, event.channel_type)
              : AddUnreadChannel(event.channel_id, event.unread_count, event.channel_type),
          );
        }
      }
    };

    const handleMessageUpdated = event => {
      if (event.channel_id === channel.data.id) {
        const lastMsg =
          channel.state.messages.length > 0 ? channel.state.messages[channel.state.messages.length - 1] : null;
        getLastMessage(lastMsg);
      }
    };

    const handleMessageDeleted = event => {
      if (event.channel_id === channel.data.id) {
        const lastMsg =
          channel.state.messages.length > 0 ? channel.state.messages[channel.state.messages.length - 1] : null;
        getLastMessage(lastMsg);
      }
    };

    const handleMessageRead = event => {
      if (event.user.id === user_id && event.channel_id === channel.data.id) {
        setCount(0);

        if (unreadChannels.some(item => item.id === event.channel_id)) {
          dispatch(RemoveUnreadChannel(event.channel_id));
        }
      }
    };

    const handleMemberBlocked = event => {
      if (event.user.id === user_id && event.channel_id === channel.data.id) {
        setIsBlocked(true);
      }
    };

    const handleMemberUnBlocked = event => {
      if (event.user.id === user_id && event.channel_id === channel.data.id) {
        setIsBlocked(false);
      }
    };

    client.on(ClientEvents.MessageNew, handleMessageNew);
    client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
    client.on(ClientEvents.MessageDeleted, handleMessageDeleted);
    client.on(ClientEvents.MessageRead, handleMessageRead);
    client.on(ClientEvents.MemberBlocked, handleMemberBlocked);
    client.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
    return () => {
      client.off(ClientEvents.MessageNew, handleMessageNew);
      client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.off(ClientEvents.MessageDeleted, handleMessageDeleted);
      client.off(ClientEvents.MessageRead, handleMessageRead);
      client.off(ClientEvents.MemberBlocked, handleMemberBlocked);
      client.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
    };
  }, [channel, user_id, users.length, unreadChannels]);

  const onLeftClick = () => {
    if (!isRightClick && currentChannel?.id !== channelId) {
      navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
      dispatch(onReplyMessage(null));
      dispatch(onEditMessage(null));
    }
    setAnchorEl(null);
  };

  const onRightClick = event => {
    event.preventDefault();
    setIsRightClick(true);
    setAnchorEl(event.currentTarget);
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
    setIsRightClick(false);
  };

  const onMarkAsRead = () => {
    if (count > 0) {
      dispatch(SetMarkReadChannel(channel));
    }
  };

  const onLeave = () => {
    const payload = {
      openDialog: true,
      channel,
      userId: user_id,
      type: ConfirmType.LEAVE,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onDelete = () => {
    const payload = {
      openDialog: true,
      channel,
      userId: user_id,
      type: ConfirmType.DELETE,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onTruncate = () => {
    const payload = {
      openDialog: true,
      channel,
      userId: user_id,
      type: ConfirmType.TRUNCATE,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onPinChannel = async () => {
    if (isPinned) {
      await client.unpinChannel(channelType, channelId);
    } else {
      await client.pinChannel(channelType, channelId);
    }
  };

  const isMuted = mutedChannels.some(channel => channel.id === channelId);
  const isSelectedChannel = currentChannel?.id === channelId;

  return (
    <>
      <StyledChatBox
        onClick={onLeftClick}
        onContextMenu={onRightClick}
        sx={{
          backgroundColor: isSelectedChannel ? `${alpha(theme.palette.primary.main, 0.2)} !important` : 'transparent',
          padding: '6px',
        }}
        gap={2}
      >
        {/* -------------------------------avatar------------------------------- */}
        {isPublic ? (
          <AvatarComponent
            name={channel.data.name}
            url={channel.data?.image || ''}
            width={60}
            height={60}
            isPublic={isPublic}
            shape={AvatarShape.Round}
          />
        ) : (
          <ChannelAvatar channel={channel} width={60} height={60} shape={AvatarShape.Round} />
        )}

        {/* -------------------------------content------------------------------- */}
        <Box sx={{ flex: 1, minWidth: 'auto', overflow: 'hidden' }}>
          {/* -------------------------------channel name------------------------------- */}
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
              {channel.data.name}
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1}>
              {isMuted && <SpearkerOffIcon size={14} />}
              {isPinned && <PushPin size={14} color={theme.palette.primary.main} weight="fill" />}

              {!isBlocked && (
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
              )}
            </Stack>
          </Stack>

          {/* -------------------------------last message------------------------------- */}
          {!isBlocked && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Typography
                variant="caption"
                sx={{
                  color: count > 0 ? 'inherit' : theme.palette.text.secondary,
                  flex: 1,
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '14px',
                  display: 'block',
                  fontWeight: count > 0 ? 600 : 400,
                }}
              >
                {isBlocked ? 'You have block this user' : lastMessage}
              </Typography>

              {count > 0 ? <Badge variant="dot" color="error" sx={{ margin: '0 10px 0 15px' }} /> : null}
            </Stack>
          )}
        </Box>
      </StyledChatBox>

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
        {/* --------------------Pin/Unpin channel---------------- */}
        <MenuItem onClick={onPinChannel}>
          {isPinned ? <PushPinSlash /> : <PushPin />}
          {isPinned ? 'Unpin from top' : 'Pin to top'}
        </MenuItem>

        {/* --------------------Mark as read---------------- */}
        {count > 0 && (
          <MenuItem onClick={onMarkAsRead}>
            <EnvelopeSimpleOpen />
            Mark as read
          </MenuItem>
        )}

        {/* --------------------Delete channel---------------- */}
        {showItemDeleteChannel && (
          <MenuItem sx={{ color: theme.palette.error.main }} onClick={onDelete}>
            <Trash color={theme.palette.error.main} />
            Delete channel
          </MenuItem>
        )}

        {/* --------------------Leave channel---------------- */}
        {showItemLeaveChannel && (
          <MenuItem sx={{ color: theme.palette.error.main }} onClick={onLeave}>
            <SignOut color={theme.palette.error.main} />
            Leave channel
          </MenuItem>
        )}

        {/* --------------------Delete chat---------------- */}
        {showItemDeleteConversation && (
          <MenuItem sx={{ color: theme.palette.error.main }} onClick={onTruncate}>
            <Trash color={theme.palette.error.main} />
            Delete chat
          </MenuItem>
        )}
      </StyledMenu>
    </>
  );
};

export default ChatElement;
