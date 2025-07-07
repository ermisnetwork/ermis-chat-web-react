import React, { useEffect, useState } from 'react';
import { Badge, Box, Stack, Typography, Menu, MenuItem } from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { SetMarkReadChannel } from '../redux/slices/channel';
import ChannelAvatar from './ChannelAvatar';
import { formatString, isChannelDirect, isPublicChannel, myRoleInChannel } from '../utils/commons';
import { ClientEvents } from '../constants/events-const';
import { onEditMessage, onReplyMessage } from '../redux/slices/messages';
import { EnvelopeSimpleOpen, PushPin, PushPinSlash, SignOut, Trash } from 'phosphor-react';
import { ConfirmType, MessageType, RoleMember, TabValueChannel } from '../constants/commons-const';
import { setChannelConfirm } from '../redux/slices/dialog';
import { convertMessageSystem } from '../utils/messageSystem';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import AvatarComponent from './AvatarComponent';
import { convertLastMessageSignal } from '../utils/messageSignal';
import { getDisplayDate } from '../utils/formatTime';
import { client } from '../client';
import { SpearkerOffIcon } from './Icons';

const truncateText = (string, n) => {
  return string?.length > n ? `${string?.slice(0, n)}...` : string;
};

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
  const { currentChannel, mutedChannels, selectedTabChannel } = useSelector(state => state.channel);
  const { all_members } = useSelector(state => state.member);
  const { user_id } = useSelector(state => state.auth);
  const { tab } = useSelector(state => state.app);

  const channelIdSelected = currentChannel?.data.id;
  const channelId = channel.data.id;
  const channelType = channel.data.type;
  const isDirect = isChannelDirect(channel);
  const myRole = myRoleInChannel(channel);
  const isPublic = isPublicChannel(channel);
  const tabInvite = selectedTabChannel === TabValueChannel.Invite;
  const isPinned = channel.data.is_pinned;

  const [lastMessage, setLastMessage] = useState('');
  const [count, setCount] = useState(0);
  const [timer, setTimer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [isRightClick, setIsRightClick] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState('');
  const [lastMessageUpdated, setLastMessageUpdated] = useState(''); // trick fix bug lastMessage ko được lưu khi click sang channel khác

  const showItemLeaveChannel = !isDirect && [RoleMember.MOD, RoleMember.MEMBER].includes(myRole);
  const showItemDeleteChannel = !isDirect && [RoleMember.OWNER].includes(myRole);
  const showItemDeleteConversation = isDirect;

  const replaceMentionsWithNames = inputValue => {
    all_members.forEach(user => {
      inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
    });
    return inputValue;
  };

  const getLastMessage = (message, isUpdated) => {
    if (message) {
      const date = message.updated_at ? message.updated_at : message.created_at;
      const sender = message.user;
      const senderName = sender ? sender?.name || sender?.id : message.user.id;
      // setLastMessageAt(dayjs(date).format('hh:mm A'));
      setLastMessageAt(getDisplayDate(date));
      if (message.type === MessageType.System) {
        const messageSystem = convertMessageSystem(message.text, all_members, isDirect);
        setLastMessage(`${senderName}: ${messageSystem}`);
      } else if (message.type === MessageType.Signal) {
        const messageSignal = convertLastMessageSignal(message.text);
        if (isUpdated) {
          setLastMessageUpdated(messageSignal);
        } else {
          setLastMessage(messageSignal);
        }
      } else if (message.type === MessageType.Sticker) {
        setLastMessage(`${senderName}: Sticker`);
      } else {
        if (message.attachments) {
          const attachmentFirst = message.attachments[0];
          const isLinkPreview = attachmentFirst.type === 'linkPreview';
          if (isUpdated) {
            setLastMessageUpdated(`${senderName}: ${isLinkPreview ? attachmentFirst.link_url : attachmentFirst.title}`);
          } else {
            setLastMessage(`${senderName}: ${isLinkPreview ? attachmentFirst.link_url : attachmentFirst.title}`);
          }
        } else {
          const messagePreview = replaceMentionsWithNames(message.text);
          if (isUpdated) {
            setLastMessageUpdated(`${senderName}: ${messagePreview}`);
          } else {
            setLastMessage(`${senderName}: ${messagePreview}`);
          }
        }
      }
    } else {
      // setLastMessageAt(dayjs(channel.data.created_at).format('hh:mm A'));
      setLastMessageAt(getDisplayDate(channel.data.created_at));
      setLastMessage('No messages here yet');
    }
  };

  // useEffect(() => {
  //   setCount(channel.countUnread());
  // }, [channel]);

  useEffect(() => {
    if (channel) {
      // get last message
      let listMessage = channel?.state.messages || [];
      let lastMsg = listMessage.length > 0 ? listMessage[listMessage.length - 1] : null;
      getLastMessage(lastMsg);

      const membership = channel.state.membership;
      const blocked = membership?.blocked ?? false;
      setIsBlocked(blocked);
      setCount(channel.state.unreadCount);

      const markRead = async () => {
        dispatch(SetMarkReadChannel(channel));
        setCount(0);
        setTimer(null);
      };
      const handleMessageNew = event => {
        // lastMsg = event.message;
        // getLastMessage(event.message); // listen last message

        if (!(event.message.type === MessageType.Signal && ['1', '4'].includes(event.message.text[0]))) {
          lastMsg = event.message;
          getLastMessage(lastMsg, false); // listen last message
          setLastMessageUpdated('');
        }

        if (event.channel_id === channel?.data.id) {
          setCount(channel.state.unreadCount);
          if (channelIdSelected && channelIdSelected === event.channel_id && event.user.id !== user_id) {
            if (timer) {
              clearTimeout(timer);
            }
            setTimer(setTimeout(markRead, 1000));
          }
        }
      };

      const handleMessageUpdated = event => {
        if (lastMsg.id === event.message.id || event.message.type === MessageType.Signal) {
          getLastMessage(event.message, true);
        } else {
          // setLastMessage(prev => {
          //   if (prev === event.message_update.text) {
          //     if (event.message.type === MessageType.System) {
          //       const messageSystem = convertMessageSystem(event.message.text, all_members, isDirect);
          //       return messageSystem;
          //     } else {
          //       return event.message.text;
          //     }
          //   }
          //   return prev;
          // });

          setLastMessageUpdated(prev => {
            if (prev === event.message_update.text) {
              if (event.message.type === MessageType.System) {
                const messageSystem = convertMessageSystem(event.message.text, all_members, isDirect);
                return messageSystem;
              } else {
                return event.message.text;
              }
            }
            return prev;
          });
        }
      };

      const handleMessageDeleted = event => {
        listMessage = listMessage.filter(message => message.id !== event.message.id);
        const newLastMessage = listMessage[listMessage.length - 1];
        getLastMessage(newLastMessage);
      };

      const handleMessageRead = event => {
        if (event.user.id === user_id) {
          setCount(0);
        }
      };

      const handleMemberBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(true);
        }
      };

      const handleMemberUnBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(false);
        }
      };

      channel.on(ClientEvents.MessageNew, handleMessageNew);
      channel.on(ClientEvents.MessageUpdated, handleMessageUpdated);
      channel.on(ClientEvents.MessageDeleted, handleMessageDeleted);
      channel.on(ClientEvents.MessageRead, handleMessageRead);
      channel.on(ClientEvents.MemberBlocked, handleMemberBlocked);
      channel.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
      return () => {
        channel.off(ClientEvents.MessageNew, handleMessageNew);
        channel.off(ClientEvents.MessageUpdated, handleMessageUpdated);
        channel.off(ClientEvents.MessageDeleted, handleMessageDeleted);
        channel.off(ClientEvents.MessageRead, handleMessageRead);
        channel.off(ClientEvents.MemberBlocked, handleMemberBlocked);
        channel.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [channel, user_id, channelIdSelected, timer]);

  const onLeftClick = () => {
    const selectedChatId = channelIdSelected?.toString();
    if (!isRightClick && selectedChatId !== channelId) {
      navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
      dispatch(onReplyMessage(null));
      dispatch(onEditMessage(null));
    }
    setAnchorEl(null);
  };

  const onRightClick = event => {
    if (!tabInvite) {
      event.preventDefault();
      setIsRightClick(true);
      setAnchorEl(event.currentTarget);
    }
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
      await client.unpinChannel(channel.type, channel.id);
    } else {
      await client.pinChannel(channel.type, channel.id);
    }
  };

  const isMuted = mutedChannels.some(channel => channel.id === channelId);

  const selectedChatId = channelIdSelected?.toString();
  let isSelected = selectedChatId === channelId;

  if (!selectedChatId) {
    isSelected = false;
  }

  return (
    <>
      <StyledChatBox
        onClick={onLeftClick}
        onContextMenu={onRightClick}
        sx={{
          backgroundColor: isSelected ? `${alpha(theme.palette.primary.main, 0.2)} !important` : 'transparent',
          padding: '6px',
        }}
        gap={2}
      >
        {/* -------------------------------avatar------------------------------- */}
        {isPublic ? (
          <AvatarComponent
            name={channel.data.name}
            url={channel.data.image}
            width={60}
            height={60}
            isPublic={isPublic}
          />
        ) : (
          <ChannelAvatar channel={channel} width={60} height={60} />
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
              {formatString(channel.data.name)}
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1}>
              {isMuted && <SpearkerOffIcon size={14} />}
              {isPinned && <PushPin size={14} color={theme.palette.primary.main} weight="fill" />}

              {!tabInvite && !isBlocked && (
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
          {!tabInvite && !isBlocked && (
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
                {isBlocked ? 'You have block this user' : lastMessageUpdated ? lastMessageUpdated : lastMessage}
              </Typography>

              {count > 0 ? <Badge variant="dot" color="primary" sx={{ margin: '0 10px 0 15px' }} /> : null}
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
