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
  IconButton,
  alpha,
  Backdrop,
} from '@mui/material';
import { CaretDown, PushPin, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { displayMessageWithMentionName, formatString } from '../utils/commons';
import { onUnPinMessage, setSearchMessageId } from '../redux/slices/messages';
import UnpinMessageDialog from '../sections/dashboard/UnpinMessageDialog';
import { SetPinnedMessages } from '../redux/slices/channel';
import { ClientEvents } from '../constants/events-const';
import { MessageType } from '../constants/commons-const';
import { ChatJumpIcon } from './Icons';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
  borderRadius: '16px !important',
  width: '100%',
  boxShadow: theme.shadows[5],
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  width: '100%',
  minHeight: 'auto !important',
  padding: '5px 15px',
  '& .MuiAccordionSummary-content': {
    margin: '0px !important',
    width: '100%',
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
}));

const MessageBox = ({ message, setIsOpen, showActions, messageCount }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { mentions } = useSelector(state => state.channel);

  const sender = message.user;
  const senderName = sender ? sender?.name : formatString(message.user.id);

  const getMsg = message => {
    if (message.type === MessageType.Poll) {
      return <>Poll</>;
    } else if (message.type === MessageType.Sticker) {
      return <>Sticker</>;
    } else {
      if (message.text) {
        return <span dangerouslySetInnerHTML={{ __html: displayMessageWithMentionName(message.text, mentions) }} />;
      } else if (message.attachments && message.attachments.length) {
        const titles = message.attachments.map(item => item?.title || item?.link_url).join(', ');
        return <>{titles}</>;
      }
    }
  };

  const onJumpToMsg = messageId => {
    dispatch(setSearchMessageId(messageId));
    setIsOpen(false);
  };

  const onUnPin = messageId => {
    dispatch(onUnPinMessage({ openDialog: true, messageId }));
    setIsOpen(false);
  };

  return (
    <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
        }}
      >
        <PushPin size={14} weight="fill" color={theme.palette.primary.main} />
      </Box>

      <Box sx={{ width: 'calc(100% - 104px)', overflow: 'hidden', padding: '0px 15px' }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 400,
            fontSize: '14px',
            color: 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {getMsg(message)}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          From <strong>{senderName}</strong>
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ width: '72px' }}>
        {showActions ? (
          <>
            <IconButton onClick={() => onJumpToMsg(message.id)}>
              <ChatJumpIcon size={24} color={theme.palette.text.primary} />
            </IconButton>

            <IconButton onClick={() => onUnPin(message.id)}>
              <X size={20} color={theme.palette.text.primary} />
            </IconButton>
          </>
        ) : (
          <Box
            sx={{
              minWidth: '50px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: `1px solid ${theme.palette.text.primary}`,
              fontSize: '12px',
              gap: '6px',
            }}
          >
            +{messageCount} <CaretDown />
          </Box>
        )}
      </Stack>
    </Stack>
  );
};

export default function PinnedMessages() {
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

  if (pinnedMessages.length === 0) return null;

  const onChangeAccordion = () => {
    if (pinnedMessages.length <= 1) return;
    setIsOpen(!isOpen);
  };

  const firstMsg = pinnedMessages[0];

  return (
    <>
      {isOpen && <Backdrop open={true} onClick={() => setIsOpen(false)} />}

      <StyledAccordion disableGutters expanded={isOpen} onChange={onChangeAccordion}>
        <StyledAccordionSummary aria-controls="panel1-content" id="panel1-header">
          <MessageBox
            message={firstMsg}
            setIsOpen={setIsOpen}
            showActions={pinnedMessages.length > 1 ? isOpen : true}
            messageCount={pinnedMessages.length - 1}
          />
        </StyledAccordionSummary>

        {pinnedMessages.length > 1 && (
          <StyledAccordionDetails>
            {pinnedMessages.slice(1).map((message, index) => {
              return (
                <Box key={index} sx={{ padding: '5px 15px' }}>
                  <MessageBox message={message} setIsOpen={setIsOpen} showActions={true} />
                </Box>
              );
            })}
          </StyledAccordionDetails>
        )}
      </StyledAccordion>
      <UnpinMessageDialog />
    </>
  );
}
