import { Stack, Box, Typography, Chip } from '@mui/material';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import useResponsive from '../../hooks/useResponsive';
import AttachmentMsg from '../../components/message/AttachmentMsg';
import LinkPreviewMsg from '../../components/message/LinkPreviewMsg';
import PollMsg from '../../components/message/PollMsg';
import ReplyMsg from '../../components/message/ReplyMsg';
import SignalMsg from '../../components/message/SignalMsg';
import TextMsg from '../../components/message/TextMsg';
import StickerMsg from '../../components/message/StickerMsg';

import { useDispatch, useSelector } from 'react-redux';
import { checkMyMessage, formatString } from '../../utils/commons';
import MemberAvatar from '../../components/MemberAvatar';
import ReadBy from '../../components/ReadBy';
import ReactionsMessage from '../../components/ReactionsMessage';
import { Trash, WarningCircle } from 'phosphor-react';
import { MessageType, SidebarType } from '../../constants/commons-const';
import { client } from '../../client';
import { setSearchMessageId } from '../../redux/slices/messages';
import { renderSystemMessage } from '../../utils/messageSystem';
import { AnimatePresence, motion } from 'framer-motion';
import { setSidebar, SetUserInfo } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';

const messageMotion = {
  layout: true,
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
    mass: 0.4,
  },
};

const StyledMessage = styled(Stack)(({ theme }) => ({
  '&:hover': {
    '& .messageActions': {
      visibility: 'visible',
    },

    '& .quickReactions': {
      visibility: 'visible',
    },
  },
  '&.myMessage': {
    '& .linkUrl': {
      color: '#f1f1f1',
    },
  },
  '& .messageActions.open': {
    visibility: 'visible',
  },

  '& .quickReactions': {
    visibility: 'hidden',
  },
}));

const MessageList = React.memo(
  ({
    messageListRef,
    messages,
    lastReadMessageId,
    targetId,
    setTargetId,
    isDirect,
    setShowChipUnread,
    onScrollToReplyMsg,
    highlightMsg,
    setHighlightMsg,
  }) => {
    const { t } = useTranslation();
    const users = client.state.users ? Object.values(client.state.users) : [];
    const dispatch = useDispatch();
    const messageRefs = useRef({});
    const unreadRefs = useRef([]);
    const theme = useTheme();
    const isLgToXl = useResponsive('between', null, 'lg', 'xl');
    const isMobileToLg = useResponsive('down', 'lg');
    const { user_id } = useSelector(state => state.auth);
    const {
      activeChannels = [],
      pinnedChannels = [],
      isGuest,
      isBlocked,
      isBanned,
    } = useSelector(state => state.channel);

    const lastReadIndex = useMemo(
      () => messages.findIndex(msg => msg.id === lastReadMessageId),
      [messages, lastReadMessageId],
    );

    useEffect(() => {
      if (targetId && messageRefs.current[targetId]) {
        messageRefs.current[targetId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          setTargetId('');
          setHighlightMsg('');
          dispatch(setSearchMessageId(''));
        }, 1000);
      }
    }, [targetId]);

    useEffect(() => {
      if (messageListRef.current) {
        const chatBoxHeight = messageListRef.current.offsetHeight;

        // Tính tổng chiều cao của các tin nhắn chưa đọc
        const totalUnreadHeight = unreadRefs.current.reduce((acc, msgRef) => {
          return acc + (msgRef?.offsetHeight || 0);
        }, 0);

        // So sánh chiều cao tổng của tin nhắn chưa đọc với chiều cao hộp chat
        setShowChipUnread(totalUnreadHeight > chatBoxHeight);
      }
    }, [messageListRef, unreadRefs]);

    const setMessageRef = useCallback(
      (id, element, index) => {
        if (element) {
          messageRefs.current[id] = element;
          if (lastReadIndex >= 0 && index > lastReadIndex) {
            unreadRefs.current[index - lastReadIndex - 1] = element;
          }
        }
      },
      [lastReadIndex],
    );

    const getForwardChannelName = useCallback(
      forwardCid => {
        if (!forwardCid) return '';

        if (activeChannels.length || pinnedChannels.length) {
          const parts = forwardCid.split(':');
          const channelId = parts.slice(1).join(':');

          const channel = [...activeChannels, ...pinnedChannels].find(ch => ch.id === channelId);

          if (channel) {
            return formatString(channel.data.name);
          }
          return '';
        }

        return '';
      },
      [activeChannels, pinnedChannels],
    );

    const renderMessage = useCallback(
      el => {
        if (!el) return null;

        const isMyMessage = checkMyMessage(user_id, el.user.id);
        const messageType = el.type;
        const forwardChannelName = getForwardChannelName(el?.forward_cid);
        const quotedMessage = el?.quoted_message;

        // Handle deleted messages
        if (el.deleted_at) {
          return (
            <Stack direction="row" justifyContent={isMyMessage ? 'end' : 'start'} alignItems="center">
              <Box
                px={1.5}
                py={1.5}
                sx={{
                  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
                  borderRadius: 1.5,
                  width: 'max-content',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.grey[600],
                }}
              >
                <Trash size={16} color={theme.palette.grey[600]} />
                &nbsp;&nbsp;{t('chatComponent.message_delete')}
              </Box>
            </Stack>
          );
        }

        // Handle quoted messages
        if (quotedMessage) {
          return (
            <ReplyMsg message={{ ...el, isMyMessage }} all_members={users} onScrollToReplyMsg={onScrollToReplyMsg} />
          );
        }

        // Handle different message types
        switch (messageType) {
          case MessageType.Regular:
            if (el.attachments && el.attachments.length > 0) {
              // Nếu trong attachmens có type linkPreview thì hiển thị Attachmens UI. Chỉ hiển thị LinkPreview UI nếu msg chỉ là link
              if (
                el.attachments.some(attachment =>
                  ['video', 'image', 'file', 'voiceRecording'].includes(attachment.type),
                )
              ) {
                return <AttachmentMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
              } else {
                const linkPreview = el.attachments[0]; // chỉ hiển thị linkPreview đầu tiên
                const isLinkPreview = linkPreview?.title;

                if (isLinkPreview) {
                  return <LinkPreviewMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
                } else {
                  return <TextMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
                }
              }
            } else {
              return <TextMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
            }

          case MessageType.Reply:
            if (el.quoted_message) {
              return (
                <ReplyMsg
                  message={{ ...el, isMyMessage }}
                  all_members={users}
                  onScrollToReplyMsg={onScrollToReplyMsg}
                />
              );
            } else {
              return <TextMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
            }

          case MessageType.Signal:
            return <SignalMsg message={{ ...el, isMyMessage }} />;

          case MessageType.Poll:
            return <PollMsg message={{ ...el, isMyMessage }} all_members={users} />;

          case MessageType.Sticker:
            return <StickerMsg message={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;

          default:
            return null;
        }
      },
      [user_id, getForwardChannelName, theme.palette, t, users, onScrollToReplyMsg],
    );

    const onSelectMember = useCallback(
      user => {
        dispatch(setSidebar({ type: SidebarType.UserInfo, open: true }));
        dispatch(SetUserInfo(user));
      },
      [dispatch],
    );

    // Memoize filtered messages
    const filteredMessages = useMemo(
      () => messages.filter(item => !(item.type === MessageType.Signal && ['1', '4'].includes(item.text[0]))),
      [messages],
    );

    if (messages.length === 0) return null;

    return (
      <Box sx={{ padding: isMobileToLg ? '20px' : isLgToXl ? '40px 50px' : '40px 90px', overflow: 'hidden' }}>
        <Stack sx={{ position: 'relative' }}>
          <AnimatePresence initial={false}>
            {filteredMessages.map((el, idx) => {
              const messageType = el.type;
              let sender = el.user;
              // Nếu thiếu name/avatar thì lấy từ users list
              if (!sender?.name || !sender?.avatar) {
                const foundUser = users.find(u => u.id === el.user?.id);
                if (foundUser) sender = { ...sender, name: foundUser.name, avatar: foundUser.avatar };
              }
              const isMyMessage = el.user.id === user_id;
              const name = sender?.name || sender?.id;

              if (messageType === MessageType.System) {
                const msgSystem = renderSystemMessage(el.text, users, isDirect, messages, t);
                return (
                  <motion.div key={el.id} {...messageMotion}>
                    {el?.date_label && (
                      <Stack
                        direction="row"
                        justifyContent="center"
                        sx={{ width: '100%', marginBottom: '15px!important' }}
                      >
                        <Chip label={el?.date_label} />
                      </Stack>
                    )}
                    <StyledMessage
                      direction="row"
                      justifyContent="center"
                      ref={element => setMessageRef(el.id, element, idx)}
                    >
                      <Typography
                        variant="body2"
                        color={theme.palette.grey[500]}
                        sx={{ textAlign: 'center', fontWeight: 400, order: 2, width: '100%', marginBottom: '10px' }}
                        dangerouslySetInnerHTML={{ __html: msgSystem }}
                      />
                    </StyledMessage>
                  </motion.div>
                );
              } else {
                const nextMsg = messages[idx + 1];
                const showAvatar = !isMyMessage && (!nextMsg || nextMsg.user.id !== el.user.id);

                return (
                  <motion.div key={el.id} {...messageMotion}>
                    {el?.date_label && (
                      <Stack
                        direction="row"
                        justifyContent="center"
                        sx={{ width: '100%', marginBottom: '15px!important' }}
                      >
                        <Chip label={el?.date_label} />
                      </Stack>
                    )}
                    <StyledMessage
                      direction="row"
                      alignItems="flex-end"
                      justifyContent={isMyMessage ? 'end' : 'start'}
                      flexWrap="wrap"
                      gap={1}
                      className={isMyMessage ? 'myMessage' : ''}
                      ref={element => setMessageRef(el.id, element, idx)}
                      sx={{
                        position: 'relative',
                        maxWidth: '100%',
                        paddingTop: '5px',
                        paddingLeft: !showAvatar ? '44px' : '0',
                        marginBottom: showAvatar ? '32px!important' : '0px!important',
                        marginTop: '0px!important',
                        opacity: el.status === 'sending' ? 0.5 : 1,
                      }}
                    >
                      {highlightMsg === el.id && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200%',
                            height: '100%',
                            backgroundColor: 'rgb(1 98 196 / 20%)',
                          }}
                        />
                      )}

                      {showAvatar && (
                        <Box
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onClick={() => onSelectMember(sender)}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: '12px',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                              position: 'absolute',
                              top: '100%',
                              left: '0px',
                              zIndex: 3,
                              whiteSpace: 'nowrap',
                              paddingTop: '5px',
                            }}
                          >
                            {name}
                          </Typography>
                          <MemberAvatar member={sender} width={36} height={36} />
                        </Box>
                      )}

                      <Stack
                        sx={{
                          minWidth: 'auto',
                          maxWidth: '90%',
                          flex: 1,
                        }}
                      >
                        {renderMessage(el)}

                        <ReactionsMessage isMyMessage={isMyMessage} message={el} />

                        {el.status === 'error' && (
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            sx={{ marginTop: '0px', position: 'absolute', bottom: '3px', right: '-9px' }}
                          >
                            <WarningCircle size={24} weight="fill" color={theme.palette.error.main} />
                          </Stack>
                        )}
                      </Stack>

                      {lastReadMessageId === el.id && (
                        <Stack direction="row" justifyContent="center" sx={{ width: '100%', margin: '10px 0' }}>
                          <Chip label={t('chatComponent.unread_message')} />
                        </Stack>
                      )}
                    </StyledMessage>
                  </motion.div>
                );
              }
            })}
          </AnimatePresence>
        </Stack>

        {!isGuest && !isBlocked && !isBanned && <ReadBy />}
      </Box>
    );
  },
);

export default MessageList;
