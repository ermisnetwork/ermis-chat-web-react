import React, { memo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import {
  Stack,
  Tooltip,
  AvatarGroup,
  styled,
  Dialog,
  DialogContent,
  DialogTitle,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from '@mui/material';
import { CheckCircle, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import MemberAvatar from './MemberAvatar';
import { formatString } from '../utils/commons';
import { fDateTime } from '../utils/formatTime';
import { ClientEvents } from '../constants/events-const';
import { AvatarShape, MessageReadType, MessageType } from '../constants/commons-const';
import { setMessageReadType } from '../redux/slices/messages';
import { FixedSizeList } from 'react-window';
import { client } from '../client';
import useResponsive from '../hooks/useResponsive';
import { motion, AnimatePresence } from 'framer-motion';

const StyledAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  cursor: 'pointer',
  minWidth: '18px',
  '& .MuiAvatar-root': {
    border: 'none',
    boxSizing: 'border-box',
    '&.MuiAvatarGroup-avatar': {
      width: '18px',
      height: '18px',
      fontSize: '10px',
      backgroundColor: `${theme.palette.info.main}!important`,
      color: '#fff',
      borderRadius: '50%',
    },
  },

  '& .MuiAvatarGroup-avatar': {
    backgroundColor: 'transparent!important',
  },
}));

const Row = memo(({ index, style, data }) => {
  const item = data[index];

  return (
    <ListItem style={style} key={item.user.id} alignItems="center">
      <ListItemAvatar sx={{ width: '40px', marginRight: 0 }}>
        <MemberAvatar
          member={{ name: item.user.name, avatar: item.user.avatar }}
          width={40}
          height={40}
          shape={AvatarShape.Round}
        />
      </ListItemAvatar>
      <ListItemText
        primary={formatString(item.user.name)}
        secondary={!isNaN(new Date(item.last_read)) ? fDateTime(item.last_read) : 'Invalid date'}
        sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}
      />
    </ListItem>
  );
});

export default function ReadBy() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isLgToXl = useResponsive('between', null, 'lg', 'xl');
  const isMobileToLg = useResponsive('down', 'lg');
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { messageReadType } = useSelector(state => state.messages);

  const [readBy, setReadBy] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const users = client.state.users ? Object.values(client.state.users) : [];

  useEffect(() => {
    if (currentChannel) {
      const messages =
        currentChannel.state.messages.filter(msg => ![MessageType.System, MessageType.Signal].includes(msg.type)) || [];

      if (messages.length) {
        const readMembers = Object.values(currentChannel.state.read).filter(
          item => item.user.id !== user_id && item.unread_messages === 0,
        );

        if (readMembers.length) {
          setReadBy(readMembers);
          dispatch(setMessageReadType(MessageReadType.Read));
        } else {
          const lastMessage = messages[messages.length - 1];
          dispatch(
            lastMessage.user.id === user_id
              ? setMessageReadType(MessageReadType.Unread)
              : setMessageReadType(MessageReadType.Empty),
          );
        }
      } else {
        dispatch(setMessageReadType(MessageReadType.Empty));
      }

      const handleMessageNew = event => {
        if (event.user.id === user_id) {
          // tin nhắn mới tôi gửi
          setReadBy([]);
          dispatch(setMessageReadType(MessageReadType.Unread));
        } else {
          // tin nhắn mới người khác gửi
          dispatch(setMessageReadType(MessageReadType.Read));
          const obj = {
            last_read: event.received_at,
            last_read_message_id: event.message.id,
            unread_messages: 0,
            user: event.user,
          };
          setReadBy([obj]);
        }
      };

      const handleMessageRead = event => {
        dispatch(setMessageReadType(MessageReadType.Read));

        const obj = {
          last_read: event.received_at,
          last_read_message_id: event.last_read_message_id,
          unread_messages: 0,
          user: event.user,
        };

        // if (event.user.id !== user_id) {
        //   // tin nhắn mới người khác đọc
        //   setReadBy(prev =>
        //     [...prev, obj].filter((item, index, self) => index === self.findIndex(t => t.user.id === item.user.id)),
        //   );
        // }

        if (event.user.id !== user_id) {
          setReadBy(prev => {
            const map = new Map(prev.map(item => [item.user.id, item]));
            map.set(obj.user.id, obj);
            return Array.from(map.values());
          });
        }
      };

      const handleMessageDeleted = event => {
        const messages =
          currentChannel.state.messages.filter(msg => ![MessageType.System, MessageType.Signal].includes(msg.type)) ||
          [];
        if (messages.length === 0) {
          dispatch(setMessageReadType(MessageReadType.Empty));
        }
      };

      currentChannel.on(ClientEvents.MessageNew, handleMessageNew);
      currentChannel.on(ClientEvents.MessageRead, handleMessageRead);
      currentChannel.on(ClientEvents.MessageDeleted, handleMessageDeleted);

      return () => {
        currentChannel.off(ClientEvents.MessageNew, handleMessageNew);
        currentChannel.off(ClientEvents.MessageRead, handleMessageRead);
        currentChannel.off(ClientEvents.MessageDeleted, handleMessageDeleted);
      };
    }
  }, [currentChannel, user_id]);

  const renderReadBy = useCallback(() => {
    switch (messageReadType) {
      case MessageReadType.Empty:
        return null;
      case MessageReadType.Unread:
        return (
          <Tooltip title="Sent" placement="left">
            <CheckCircle size={22} color={theme.palette.grey[500]} />
          </Tooltip>
        );
      case MessageReadType.Read:
        return (
          <Tooltip title={`${readBy.length} members have seen`} placement="left">
            <AnimatePresence initial={false}>
              <StyledAvatarGroup max={5} spacing={1} onClick={() => setIsOpen(true)}>
                {readBy.map(item => {
                  const userInfo = users.find(user => user.id === item.user.id);
                  const member = {
                    name: item.user?.name ? item.user.name : userInfo ? userInfo.name : item.user.id,
                    avatar: item.user?.avatar ? item.user.avatar : userInfo ? userInfo.avatar : '',
                  };
                  return (
                    <motion.div
                      key={item.user.id}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ display: 'flex', width: '18px', height: '18px' }}
                    >
                      <MemberAvatar member={member} width={18} height={18} />
                    </motion.div>
                  );
                })}
              </StyledAvatarGroup>
            </AnimatePresence>
          </Tooltip>
        );
      default:
        return null;
    }
  }, [messageReadType, readBy, theme]);

  return (
    <Stack
      direction="row"
      justifyContent="flex-end"
      sx={{
        position: 'absolute',
        right: isMobileToLg ? '20px' : isLgToXl ? '50px' : '90px',
        bottom: 0,
      }}
    >
      {renderReadBy()}

      {isOpen && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={isOpen}
          // TransitionComponent={Transition}
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <DialogTitle sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {readBy.length} {readBy.length === 1 ? 'member' : 'members'} have seen the message
            <IconButton
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <X />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <FixedSizeList
              height={320}
              width="auto"
              itemSize={64}
              itemCount={readBy.length}
              itemData={readBy}
              style={{ maxHeight: '320px', height: 'auto', margin: '0 -24px', padding: '0 24px' }}
              className="customScrollbar"
            >
              {Row}
            </FixedSizeList>
          </DialogContent>
        </Dialog>
      )}
    </Stack>
  );
}
