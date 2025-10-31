import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Box, Stack, Typography } from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { Play } from 'phosphor-react';
import PropTypes from 'prop-types';

import { ClientEvents } from '../constants/events-const';
import { MessageType, SidebarType } from '../constants/commons-const';
import { DEFAULT_PATH } from '../config';
import { convertMessageSystem } from '../utils/messageSystem';
import { convertMessageSignal } from '../utils/messageSignal';
import { getDisplayDate } from '../utils/formatTime';
import { client } from '../client';
import AvatarGeneralDefault from './AvatarGeneralDefault';
import { setSidebar } from '../redux/slices/app';

// Constants
const ATTACHMENT_IMAGE_SIZE = 20;
const PLAY_ICON_SIZE = 10;
const PLAY_ICON_STYLE = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
};

const CALL_SIGNALS_TO_IGNORE = ['1', '4']; // AudioCallStarted, VideoCallStarted

const StyledGeneralItem = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  padding: '6px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
}));

const GeneralElement = ({ idSelected }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { unreadChannels = [] } = useSelector(state => state.channel);
  const { parentChannel } = useSelector(state => state.topic);
  const { user_id } = useSelector(state => state.auth);

  const [lastMessage, setLastMessage] = useState('');
  const [lastMessageAt, setLastMessageAt] = useState('');

  // Memoized values
  const users = useMemo(() => (client.state.users ? Object.values(client.state.users) : []), [client.state.users]);

  const hasUnread = useMemo(
    () => unreadChannels?.some(item => item.id === parentChannel?.id && item.unreadCount > 0),
    [unreadChannels, parentChannel?.id],
  );

  const isSelected = useMemo(() => idSelected === parentChannel?.id, [idSelected, parentChannel?.id]);

  // Memoized helper functions
  const replaceMentionsWithNames = useCallback(
    inputValue => {
      users.forEach(user => {
        inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
      });
      return inputValue;
    },
    [users],
  );

  const renderAttachmentPreview = useCallback((attachment, senderName) => {
    const isImage = attachment.type === 'image';
    const isVideo = attachment.type === 'video';
    const isLinkPreview = attachment.type === 'linkPreview';

    if (isImage) {
      return (
        <>
          {`${senderName}:`}
          <img
            src={attachment.image_url}
            alt={attachment.title || 'image'}
            style={{
              width: ATTACHMENT_IMAGE_SIZE,
              height: ATTACHMENT_IMAGE_SIZE,
              borderRadius: '5px',
              display: 'inline-block',
              verticalAlign: 'top',
              margin: '0px 4px',
            }}
          />
          {attachment.title || 'Photo'}
        </>
      );
    }

    if (isVideo) {
      return (
        <>
          {`${senderName}:`}
          <span style={{ position: 'relative', display: 'inline-block', margin: '0px 4px' }}>
            <img
              src={attachment.thumb_url}
              alt={attachment.title || 'video'}
              style={{
                width: ATTACHMENT_IMAGE_SIZE,
                height: ATTACHMENT_IMAGE_SIZE,
                borderRadius: '5px',
                display: 'inline-block',
                verticalAlign: 'top',
              }}
            />
            <Play size={PLAY_ICON_SIZE} color="#fff" weight="fill" style={PLAY_ICON_STYLE} />
          </span>
          {attachment.title || 'Video'}
        </>
      );
    }

    return `${senderName}: ${isLinkPreview ? attachment.link_url : attachment.title}`;
  }, []);

  const getLastMessage = useCallback(
    message => {
      if (!message) {
        setLastMessageAt(getDisplayDate(parentChannel?.data?.created_at));
        setLastMessage(t('chatElement.no_message'));
        return;
      }

      const date = message.updated_at || message.created_at;
      const sender = message.user;
      const senderId = sender?.id;
      const isMe = user_id === senderId;
      const senderName = isMe ? t('you') : sender?.name || senderId;

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
            setLastMessage(renderAttachmentPreview(attachmentLast, senderName));
          } else {
            const messagePreview = replaceMentionsWithNames(message.text || '');
            setLastMessage(`${senderName}: ${messagePreview}`);
          }
          break;
        }
      }
    },
    [user_id, users, t, parentChannel?.data?.created_at, renderAttachmentPreview, replaceMentionsWithNames],
  );

  // Memoized event handlers
  const handleMessageNew = useCallback(
    event => {
      if (event.channel_id === parentChannel?.data?.id) {
        if (!(event.message.type === MessageType.Signal && CALL_SIGNALS_TO_IGNORE.includes(event.message.text[0]))) {
          getLastMessage(event.message);
        }
      }
    },
    [parentChannel?.data?.id, getLastMessage],
  );

  const handleMessageUpdated = useCallback(
    event => {
      if (event.channel_id === parentChannel?.data?.id) {
        const lastMsg =
          parentChannel?.state?.messages?.length > 0
            ? parentChannel.state.messages[parentChannel.state.messages.length - 1]
            : null;
        getLastMessage(lastMsg);
      }
    },
    [parentChannel?.data?.id, parentChannel?.state?.messages, getLastMessage],
  );

  const handleMessageDeleted = useCallback(
    event => {
      if (event.channel_id === parentChannel?.data?.id) {
        const lastMsg =
          parentChannel?.state?.messages?.length > 0
            ? parentChannel.state.messages[parentChannel.state.messages.length - 1]
            : null;
        getLastMessage(lastMsg);
      }
    },
    [parentChannel?.data?.id, parentChannel?.state?.messages, getLastMessage],
  );

  const onLeftClick = useCallback(() => {
    navigate(`${DEFAULT_PATH}/${parentChannel?.cid}`);
    dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
  }, [navigate, parentChannel?.cid]);

  useEffect(() => {
    const lastMsg =
      parentChannel?.state?.messages?.length > 0
        ? parentChannel.state.messages[parentChannel.state.messages.length - 1]
        : null;
    getLastMessage(lastMsg);

    client.on(ClientEvents.MessageNew, handleMessageNew);
    client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
    client.on(ClientEvents.MessageDeleted, handleMessageDeleted);

    return () => {
      client.off(ClientEvents.MessageNew, handleMessageNew);
      client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.off(ClientEvents.MessageDeleted, handleMessageDeleted);
    };
  }, [parentChannel, getLastMessage, handleMessageNew, handleMessageUpdated, handleMessageDeleted]);

  // Memoized styles
  const containerStyle = useMemo(
    () => ({
      backgroundColor: isSelected ? `${alpha(theme.palette.primary.main, 0.1)} !important` : 'transparent',
    }),
    [isSelected, theme.palette.primary.main],
  );

  return (
    <StyledGeneralItem onClick={onLeftClick} sx={containerStyle} gap={1}>
      {/* Avatar */}
      <AvatarGeneralDefault />

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 'auto', overflow: 'hidden' }}>
        {/* Name and timestamp */}
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
            {t('chat_element.general')}
          </Typography>

          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '10px',
            }}
            variant="caption"
          >
            {lastMessageAt}
          </Typography>
        </Stack>

        {/* Last message and badge */}
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

          {hasUnread && <Badge variant="dot" color="error" sx={{ margin: '0 10px 0 15px' }} />}
        </Stack>
      </Box>
    </StyledGeneralItem>
  );
};

// PropTypes validation
GeneralElement.propTypes = {
  idSelected: PropTypes.string,
};

export default GeneralElement;
