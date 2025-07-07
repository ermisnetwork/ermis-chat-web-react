import React, { useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import {
  Typography,
  Stack,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
  List,
  ListItem,
  IconButton,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
} from '@mui/material';
import {
  PushPin,
  CaretDown,
  PushPinSimpleSlash,
  ChatCircleText,
  Link,
  FileText,
  Sticker,
  ChartBar,
} from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { formatString } from '../utils/commons';
import MemberAvatar from './MemberAvatar';
import { onUnPinMessage, setSearchMessageId } from '../redux/slices/messages';
import UnpinMessageDialog from '../sections/dashboard/UnpinMessageDialog';
import { SetPinnedMessages } from '../redux/slices/channel';
import { ClientEvents } from '../constants/events-const';
import { MessageType } from '../constants/commons-const';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
  borderRadius: '0px !important',
  width: '100%',
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: 'auto !important',
  padding: '5px 15px',
  '& .MuiAccordionSummary-content': {
    margin: '0px !important',
    width: 'calc(100% - 16px)',
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
  '& .MuiListItemText-root': {
    '& .MuiListItemText-primary': {
      fontSize: '14px',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .MuiListItemText-secondary': {
      fontSize: '12px',
    },
  },
}));

export default function PinnedMessages() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { pinnedMessages, currentChannel } = useSelector(state => state.channel);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      const handlePinnedMessages = event => {
        dispatch(SetPinnedMessages([...currentChannel.state.pinnedMessages].reverse()));
      };

      currentChannel.on(ClientEvents.MessagePinned, handlePinnedMessages);
      currentChannel.on(ClientEvents.MessageUnpinned, handlePinnedMessages);
      currentChannel.on(ClientEvents.MessageDeleted, handlePinnedMessages);

      return () => {
        currentChannel.off(ClientEvents.MessagePinned, handlePinnedMessages);
        currentChannel.off(ClientEvents.MessageUnpinned, handlePinnedMessages);
        currentChannel.off(ClientEvents.MessageDeleted, handlePinnedMessages);
      };
    }
  }, [currentChannel]);

  const getMsg = message => {
    if (message.attachments && message.attachments.length) {
      const titles = message.attachments.map(item => item?.title || item?.link_url).join(', ');
      return (
        <>
          <Link size={16} color={theme.palette.primary.main} style={{ transform: 'translateY(2px)' }} />
          &nbsp;&nbsp;
          {titles}
        </>
      );
    } else if (message.type === MessageType.Sticker) {
      return (
        <>
          <Sticker size={16} color={theme.palette.primary.main} style={{ transform: 'translateY(2px)' }} />
          &nbsp;&nbsp; Sticker
        </>
      );
    } else if (message.type === MessageType.Poll) {
      return (
        <>
          <ChartBar size={16} color={theme.palette.primary.main} style={{ transform: 'translateY(2px)' }} />
          &nbsp;&nbsp; Poll
        </>
      );
    } else {
      return (
        <>
          <FileText size={16} color={theme.palette.primary.main} style={{ transform: 'translateY(2px)' }} />
          &nbsp;&nbsp;
          {message.text}
        </>
      );
    }
  };

  if (pinnedMessages.length === 0) return null;

  const firstMsg = pinnedMessages[0];
  const senderFirstMsg = firstMsg.user;
  const senderNameFirstMsg = senderFirstMsg ? senderFirstMsg?.name : formatString(firstMsg.user.id);

  const onJumpToMsg = messageId => {
    dispatch(setSearchMessageId(messageId));
    setIsOpen(false);
  };

  const onUnPin = async messageId => {
    dispatch(onUnPinMessage({ openDialog: true, messageId }));
  };

  return (
    <>
      <StyledAccordion disableGutters expanded={isOpen} onChange={() => setIsOpen(!isOpen)}>
        <StyledAccordionSummary expandIcon={<CaretDown />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span" sx={{ width: '100%', paddingRight: '15px' }}>
            <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
              <PushPin size={18} weight="fill" color={theme.palette.primary.main} />
              <Box sx={{ paddingLeft: '15px', width: 'calc(100% - 18px)' }}>
                <Typography component="div" sx={{ fontWeight: 700, fontSize: '14px' }}>
                  Pinned messages
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {`${senderNameFirstMsg}: `}
                  {getMsg(firstMsg)}
                </Typography>
              </Box>
            </Stack>
          </Typography>
        </StyledAccordionSummary>

        <StyledAccordionDetails>
          <List dense sx={{ maxHeight: '250px', overflowY: 'auto' }} className="customScrollbar">
            {pinnedMessages.map((message, index) => {
              const sender = message.user;
              const senderName = sender ? sender?.name : message.user.id;
              const senderAvatar = sender ? sender?.avatar : '';
              const senderId = message.user.id;
              return (
                <ListItem
                  key={index}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="unpin" onClick={() => onUnPin(message.id)}>
                      <PushPinSimpleSlash size={16} color={theme.palette.error.main} />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => onJumpToMsg(message.id)}>
                    <ListItemAvatar>
                      <ChatCircleText size={20} color={theme.palette.primary.main} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={getMsg(message)}
                      secondary={
                        <>
                          <MemberAvatar
                            member={{ name: senderName, avatar: senderAvatar, id: senderId }}
                            width={22}
                            height={22}
                          />
                          &nbsp;&nbsp;
                          {formatString(senderName)}
                        </>
                      }
                      secondaryTypographyProps={{ component: 'div', display: 'flex', alignItems: 'center' }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </StyledAccordionDetails>
      </StyledAccordion>

      <UnpinMessageDialog />
    </>
  );
}
