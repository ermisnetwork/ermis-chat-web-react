import { Stack, Box, Typography, Chip, Alert } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { ChatHeader, ChatFooter } from '../../components/Chat';
import useResponsive from '../../hooks/useResponsive';
import {
  AttachmentMsg,
  LinkPreviewMsg,
  PollMsg,
  ReplyMsg,
  SignalMsg,
  TextMsg,
  StickerMsg,
} from '../../sections/dashboard/Conversation';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkMyMessage,
  checkPendingInvite,
  formatString,
  getChannelName,
  handleError,
  isChannelDirect,
  isGuestInPublicChannel,
  myRoleInChannel,
  splitChannelId,
} from '../../utils/commons';
import dayjs from 'dayjs';
import InfiniteScroll from 'react-infinite-scroll-component';
import { LoadingSpinner } from '../../components/animate';
import MemberAvatar from '../../components/MemberAvatar';
import ReadBy from '../../components/ReadBy';
import { ClientEvents } from '../../constants/events-const';
import ReactionsMessage from '../../components/ReactionsMessage';
import ChannelInvitation from '../../sections/dashboard/ChannelInvitation';
import {
  AddActiveChannel,
  AddMention,
  RemoveActiveChannel,
  SetCooldownTime,
  SetFilterWords,
  SetIsBanned,
  SetIsGuest,
  SetMarkReadChannel,
  SetMemberCapabilities,
  WatchCurrentChannel,
} from '../../redux/slices/channel';
import { Clock, Trash } from 'phosphor-react';
import ScrollToBottom from '../../components/ScrollToBottom';
import DeleteMessageDialog from '../../sections/dashboard/DeleteMessageDialog';
import {
  ChatType,
  DefaultLastSend,
  MessageType,
  RoleMember,
  SidebarType,
  UploadType,
} from '../../constants/commons-const';
import BannedBackdrop from '../../components/BannedBackdrop';
import { client } from '../../client';
import { onFilesMessage, setSearchMessageId } from '../../redux/slices/messages';
import { renderSystemMessage } from '../../utils/messageSystem';
import BlockedBackdrop from '../../components/BlockedBackdrop';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import MessagesHistoryDialog from '../../sections/dashboard/MessagesHistoryDialog';
import { SetMessagesHistoryDialog } from '../../redux/slices/dialog';
import ForwardMessageDialog from '../../sections/dashboard/ForwardMessageDialog';
import PinnedMessages from '../../components/PinnedMessages';
import UploadFilesDialog from '../../sections/dashboard/UploadFilesDialog';
import Dropzone from 'react-dropzone';
import CreatePollDialog from '../../sections/dashboard/CreatePollDialog';
import PollResultDialog from '../../sections/dashboard/PollResultDialog';
import { motion } from 'framer-motion';
import UsersTyping from '../../components/UsersTyping';
import NoMessageBox from '../../components/NoMessageBox';
import { setSidebar, SetUserInfo } from '../../redux/slices/app';
import TopicPanel from './TopicPanel';
import ClosedTopicBackdrop from '../../components/ClosedTopicBackdrop';
import { SetIsClosedTopic, SetOpenTopicPanel } from '../../redux/slices/topic';

const StyledMessage = styled(motion(Stack))(({ theme }) => ({
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

const MESSAGE_LIMIT = 25;

const MessageList = ({
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
  currentChat,
}) => {
  const users = client.state.users ? Object.values(client.state.users) : [];
  const dispatch = useDispatch();
  const messageRefs = useRef({});
  const unreadRefs = useRef([]);
  const theme = useTheme();
  const isLgToXl = useResponsive('between', null, 'lg', 'xl');
  const isMobileToLg = useResponsive('down', 'lg');
  const { user_id } = useSelector(state => state.auth);
  const { activeChannels, isGuest, isBlocked, isBanned } = useSelector(state => state.channel);

  const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);

  useEffect(() => {
    if (messages.length > 0) {
      let messageElement;
      if (targetId) {
        messageElement = messageRefs.current[targetId];
      }
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        setTimeout(() => {
          setTargetId('');
          setHighlightMsg('');
          dispatch(setSearchMessageId(''));
        }, 1000);
      }
    }
  }, [messages, targetId]);

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

  const setMessageRef = (id, element, index) => {
    messageRefs.current[id] = element;

    if (lastReadIndex && lastReadIndex >= 0 && index > lastReadIndex) {
      unreadRefs.current[index - lastReadIndex - 1] = element;
    }
  };

  const getForwardChannelName = forwardCid => {
    if (!forwardCid) return '';

    if (activeChannels.length) {
      const parts = forwardCid.split(':');
      const channelId = parts.slice(1).join(':');

      const channel = activeChannels.find(ch => ch.id === channelId);

      if (channel) {
        return formatString(channel.data.name);
      }
      return '';
    }

    return '';
  };

  const renderMessage = el => {
    const isMyMessage = checkMyMessage(user_id, el.user.id);
    const messageType = el.type;
    const forwardChannelName = getForwardChannelName(el?.forward_cid);
    const quotedMessage = el?.quoted_message;

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
            &nbsp;&nbsp;Message deleted
          </Box>
        </Stack>
      );
    } else if (quotedMessage) {
      return <ReplyMsg el={{ ...el, isMyMessage }} all_members={users} onScrollToReplyMsg={onScrollToReplyMsg} />;
    } else {
      if (messageType === MessageType.Regular) {
        if (el.attachments && el.attachments.length > 0) {
          // Nếu trong attachmens có type linkPreview thì hiển thị Attachmens UI. Chỉ hiển thị LinkPreview UI nếu msg chỉ là link
          if (
            el.attachments.some(attachment => ['video', 'image', 'file', 'voiceRecording'].includes(attachment.type))
          ) {
            return <AttachmentMsg el={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
          } else {
            const linkPreview = el.attachments[0]; // chỉ hiển thị linkPreview đầu tiên
            const isLinkPreview = linkPreview?.title;

            if (isLinkPreview) {
              return <LinkPreviewMsg el={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
            } else {
              return <TextMsg el={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
            }
          }
        } else {
          return <TextMsg el={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
        }
      } else if (messageType === MessageType.Signal) {
        return <SignalMsg el={{ ...el, isMyMessage }} />;
      } else if (messageType === MessageType.Poll) {
        return <PollMsg el={{ ...el, isMyMessage }} all_members={users} />;
      } else if (messageType === MessageType.Sticker) {
        return <StickerMsg el={{ ...el, isMyMessage }} forwardChannelName={forwardChannelName} />;
      } else {
        return null;
      }
    }
  };

  const onSelectMember = user => {
    dispatch(setSidebar({ type: SidebarType.UserInfo, open: true }));
    dispatch(SetUserInfo(user));
  };

  if (messages.length === 0) return null;

  return (
    <Box sx={{ padding: isMobileToLg ? '20px' : isLgToXl ? '40px 50px' : '40px 90px' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <Stack spacing={3} sx={{ position: 'relative' }}>
          {messages
            .filter(item => !(item.type === MessageType.Signal && ['1', '4'].includes(item.text[0])))
            .map((el, idx) => {
              const messageType = el.type;
              let sender = el.user;
              // Nếu thiếu name/avatar thì lấy từ users list
              if (!sender?.name || !sender?.avatar) {
                const foundUser = users.find(u => u.id === el.user?.id);
                if (foundUser) sender = { ...sender, name: foundUser.name, avatar: foundUser.avatar };
              }
              const isMyMessage = el.user.id === user_id;
              const name = sender?.name || sender?.id;
              const isNewestMessage = idx === messages.length - 1;

              if (messageType === MessageType.System) {
                const msgSystem = renderSystemMessage(el.text, users, isDirect, messages);
                return (
                  <React.Fragment key={el.id}>
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
                      // key={el.id}
                      ref={element => setMessageRef(el.id, element, idx)}
                    >
                      <Typography
                        variant="body2"
                        color={theme.palette.grey[500]}
                        sx={{ textAlign: 'center', fontWeight: 400, order: 2, width: '100%' }}
                        dangerouslySetInnerHTML={{ __html: msgSystem }}
                      />
                    </StyledMessage>
                  </React.Fragment>
                );
              } else {
                const nextMsg = messages[idx + 1];
                const showAvatar = !isMyMessage && (!nextMsg || nextMsg.user.id !== el.user.id);

                return (
                  <React.Fragment key={el.id}>
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
                      // key={el.id}
                      className={isMyMessage ? 'myMessage' : ''}
                      ref={element => setMessageRef(el.id, element, idx)}
                      sx={{
                        position: 'relative',
                        maxWidth: '100%',
                        paddingTop: '5px',
                        paddingLeft: !showAvatar ? '44px' : '0',
                        marginBottom: showAvatar ? '32px!important' : '0px!important',
                        marginTop: '0px!important',
                      }}
                      initial={isNewestMessage ? { opacity: 0, y: 10 } : false}
                      animate={isNewestMessage ? { opacity: 1, y: 0 } : false}
                      transition={isNewestMessage ? { duration: 0.4, type: 'spring', stiffness: 200 } : undefined}
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
                          maxWidth: '100%',
                          flex: 1,
                          // overflow: 'hidden',
                        }}
                      >
                        {renderMessage(el)}

                        <ReactionsMessage isMyMessage={isMyMessage} message={el} />

                        {el.status === 'error' && (
                          <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: '3px' }}>
                            <Stack
                              direction="row"
                              justifyContent="center"
                              alignItems="center"
                              sx={{
                                backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[400] : '#545c64',
                                padding: '3px',
                                borderRadius: '32px',
                              }}
                            >
                              <Clock size={16} color={'#fff'} />
                              <span style={{ fontSize: '12px', color: '#fff' }}>&nbsp;Sending&nbsp;</span>
                            </Stack>
                          </Stack>
                        )}
                      </Stack>

                      {lastReadMessageId === el.id && (
                        <Stack direction="row" justifyContent="center" sx={{ width: '100%', margin: '10px 0' }}>
                          <Chip label="Unread message" />
                        </Stack>
                      )}
                    </StyledMessage>
                  </React.Fragment>
                );
              }
            })}
        </Stack>
      </motion.div>
      {!isGuest && !isBlocked && !isBanned && <ReadBy />}
    </Box>
  );
};

const ChatComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const messageListRef = useRef(null);
  const { currentChannel, isBlocked, isGuest, isBanned } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { deleteMessage, messageIdError, searchMessageId, forwardMessage, filesMessage } = useSelector(
    state => state.messages,
  );
  const { currentTopic, isClosedTopic } = useSelector(state => state.topic);
  const [messages, setMessages] = useState([]);
  const [usersTyping, setUsersTyping] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPendingInvite, setIsPendingInvite] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState('');
  const [isAlertInvitePending, setIsAlertInvitePending] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [showChipUnread, setShowChipUnread] = useState(false);
  const [highlightMsg, setHighlightMsg] = useState('');
  const [noMessageTitle, setNoMessageTitle] = useState('');

  const isDirect = isChannelDirect(currentChannel);
  const users = client.state.users ? Object.values(client.state.users) : [];
  const isLgToXl = useResponsive('between', null, 'lg', 'xl');
  const isMobileToLg = useResponsive('down', 'lg');
  const currentChat = currentTopic ? currentTopic : currentChannel;

  useEffect(() => {
    setUsersTyping([]);
    setMessages([]);

    if (currentChat) {
      const channelName = currentChat.data.name ? currentChat.data.name : getChannelName(currentChat, users);
      document.title = channelName;
      if (messageListRef.current) {
        messageListRef.current.scrollTop = 0;
      }
      const listMessage = currentChat.state.messages || [];
      const members = Object.values(currentChat.state.members);
      const receiverInfo = members.find(member => member.user_id !== user_id);
      setIsAlertInvitePending(
        isDirect && [RoleMember.PENDING, RoleMember.SKIPPED].includes(receiverInfo?.channel_role),
      );
      setMessages(listMessage);
      setIsPendingInvite(checkPendingInvite(currentChat));
      setUnreadCount(currentChat.state.unreadCount);
      dispatch(SetIsGuest(isGuestInPublicChannel(currentChat)));
      setNoMessageTitle(listMessage.length ? '' : 'No messages here yet...');

      const read = currentChat.state.read[user_id];
      const lastReadMsgId = read.unread_messages ? read.last_read_message_id : '';
      setLastReadMessageId(lastReadMsgId);
      let lastSend = read.last_send || DefaultLastSend;
      let duration = currentChat.data.member_message_cooldown || 0;

      const onSetCooldownTime = event => {
        const myRole = myRoleInChannel(currentChat);
        if (event.type === ClientEvents.MessageNew) {
          if (event.user.id === user_id && event.channel_type === ChatType.TEAM && myRole === RoleMember.MEMBER) {
            lastSend = event.message.created_at;

            if (duration) {
              dispatch(SetCooldownTime({ duration, lastSend }));
            } else {
              dispatch(SetCooldownTime(null));
            }
          }
        }

        if (event.type === ClientEvents.ChannelUpdated) {
          if (event.user.id !== user_id && event.channel_type === ChatType.TEAM && myRole === RoleMember.MEMBER) {
            duration = event.channel.member_message_cooldown ? event.channel.member_message_cooldown : 0;

            if (duration) {
              dispatch(SetCooldownTime({ duration, lastSend }));
            } else {
              dispatch(SetCooldownTime(null));
            }
          }
        }
      };

      const onSetFilterWords = event => {
        if (event.type === ClientEvents.ChannelUpdated && event.channel_type === ChatType.TEAM) {
          dispatch(SetFilterWords(event.channel.filter_words || []));
        }
      };

      const handleMessages = event => {
        switch (event.type) {
          case ClientEvents.MessageNew:
            if (user_id !== event.user.id || [MessageType.System, MessageType.Signal].includes(event.message.type)) {
              setMessages(prev => {
                return [...prev, event.message];
              });
              const myRole = myRoleInChannel(currentChat);
              if (![RoleMember.PENDING, RoleMember.SKIPPED].includes(myRole)) {
                setTimeout(() => {
                  dispatch(SetMarkReadChannel(currentChat));
                }, 100);
              }
            } else {
              setMessages(prev => {
                if (prev.some(item => item.id === event.message.id)) {
                  return prev.map(item => (item.id === event.message.id ? event.message : item));
                } else {
                  return [...prev, event.message];
                }
              });

              // messageListRef.current.scrollTop = 0;
              if (messageListRef.current) {
                messageListRef.current.scrollTop = 0;
              }
            }

            setLastReadMessageId('');
            setUnreadCount(0);
            // messageListRef.current.scrollTop = messageListRef.current?.scrollHeight;
            onSetCooldownTime(event);
            setNoMessageTitle('');
            break;
          case ClientEvents.ReactionDeleted:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            break;
          case ClientEvents.ReactionNew:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            break;
          case ClientEvents.MessageDeleted:
            setMessages(prev => {
              return prev.filter(item => {
                if (item.quoted_message_id && item.quoted_message_id === event.message.id) {
                  return { ...item, quoted_message: { ...item.quoted_message, deleted_at: event.message.deleted_at } };
                } else if (item.id === event.message.id) {
                  return false;
                } else {
                  return true;
                }
              });
            });
            break;
          case ClientEvents.MessageUpdated:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            dispatch(SetMessagesHistoryDialog({ openDialog: false, messages: event.message?.old_texts || [] }));
            break;
          case ClientEvents.PollChoiceNew:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            break;
          default:
            setMessages([]);
            break;
        }
      };

      const handleTypingStart = event => {
        if (user_id !== event.user.id) {
          const name = event.user?.name ? event.user?.name : formatString(event.user.id);

          const item = {
            name: name,
            id: event.user.id,
          };

          setUsersTyping(prev => {
            const updatedItems = [...prev, item];

            // lọc các item trùng nhau theo id
            const uniqueItems = Object.values(
              updatedItems.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
              }, {}),
            );

            return uniqueItems;
          });
        } else {
          setUsersTyping([]);
        }
      };

      const handleTypingStop = event => {
        if (user_id !== event.user.id) {
          setUsersTyping(prev => prev.filter(item => item.id !== event.user.id));
        } else {
          setUsersTyping([]);
        }
      };

      const handleInviteAccept = async event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;
        dispatch(WatchCurrentChannel(channelId, channelType));

        if (event.member.user_id === user_id) {
          setIsPendingInvite(false);
        } else {
          setIsAlertInvitePending(false);
          dispatch(AddMention(event.member.user_id));
        }
      };

      const handleInviteSkipped = async event => {
        if (event.member.user_id === user_id) {
          navigate(`${DEFAULT_PATH}`);
          setIsPendingInvite(false);
        }
      };

      const handleChannelUpdated = event => {
        const member_capabilities = event.channel.member_capabilities;
        dispatch(SetMemberCapabilities(member_capabilities));
        onSetCooldownTime(event);
        onSetFilterWords(event);
      };

      const handleMemberJoined = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;

        if (event.member.user_id === user_id) {
          dispatch(SetIsGuest(false));
          dispatch(AddActiveChannel(event.cid));
        } else {
          dispatch(WatchCurrentChannel(channelId, channelType));
          dispatch(AddMention(event.member.user_id));
        }
      };

      const handleMemberAdded = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;

        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleMemberRemoved = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        if (event.member.user_id !== user_id) {
          dispatch(WatchCurrentChannel(channelId, channelType));
        } else {
          navigate(`${DEFAULT_PATH}`);
          dispatch(RemoveActiveChannel(channelId));
        }
      };

      const handleMemberPromoted = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleMemberDemoted = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleMemberBanned = event => {
        if (event.member.user_id === user_id) {
          dispatch(SetIsBanned(event.member.banned));
        }
      };

      const handleMemberUnBanned = event => {
        if (event.member.user_id === user_id) {
          dispatch(SetIsBanned(event.member.banned));
        }
      };

      const handleChannelTruncate = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        setMessages([]);
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleChannelTopicEnabled = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;
        dispatch(WatchCurrentChannel(channelId, channelType));
        dispatch(SetOpenTopicPanel(true));
      };

      const handleChannelTopicDisabled = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;
        dispatch(WatchCurrentChannel(channelId, channelType));
        dispatch(SetOpenTopicPanel(false));
      };

      const handleChannelTopicClosed = event => {
        dispatch(SetIsClosedTopic(true));
      };

      const handleChannelTopicReopen = event => {
        dispatch(SetIsClosedTopic(false));
      };

      currentChat.on(ClientEvents.MessageNew, handleMessages);
      currentChat.on(ClientEvents.ReactionNew, handleMessages);
      currentChat.on(ClientEvents.ReactionDeleted, handleMessages);
      currentChat.on(ClientEvents.MessageDeleted, handleMessages);
      currentChat.on(ClientEvents.MessageUpdated, handleMessages);
      currentChat.on(ClientEvents.TypingStart, handleTypingStart);
      currentChat.on(ClientEvents.TypingStop, handleTypingStop);
      currentChat.on(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
      currentChat.on(ClientEvents.Notification.InviteSkipped, handleInviteSkipped);
      currentChat.on(ClientEvents.ChannelUpdated, handleChannelUpdated);
      currentChat.on(ClientEvents.MemberJoined, handleMemberJoined);
      currentChat.on(ClientEvents.MemberAdded, handleMemberAdded);
      currentChat.on(ClientEvents.MemberRemoved, handleMemberRemoved);
      currentChat.on(ClientEvents.MemberPromoted, handleMemberPromoted);
      currentChat.on(ClientEvents.MemberDemoted, handleMemberDemoted);
      currentChat.on(ClientEvents.MemberBanned, handleMemberBanned);
      currentChat.on(ClientEvents.MemberUnBanned, handleMemberUnBanned);
      currentChat.on(ClientEvents.PollChoiceNew, handleMessages);
      currentChat.on(ClientEvents.ChannelTruncate, handleChannelTruncate);
      currentChat.on(ClientEvents.ChannelTopicEnabled, handleChannelTopicEnabled);
      currentChat.on(ClientEvents.ChannelTopicDisabled, handleChannelTopicDisabled);
      currentChat.on(ClientEvents.ChannelTopicClosed, handleChannelTopicClosed);
      currentChat.on(ClientEvents.ChannelTopicReopen, handleChannelTopicReopen);

      return () => {
        currentChat.off(ClientEvents.MessageNew, handleMessages);
        currentChat.off(ClientEvents.ReactionNew, handleMessages);
        currentChat.off(ClientEvents.ReactionDeleted, handleMessages);
        currentChat.off(ClientEvents.MessageDeleted, handleMessages);
        currentChat.off(ClientEvents.MessageUpdated, handleMessages);
        currentChat.off(ClientEvents.TypingStart, handleTypingStart);
        currentChat.off(ClientEvents.TypingStop, handleTypingStop);
        currentChat.off(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
        currentChat.off(ClientEvents.Notification.InviteSkipped, handleInviteSkipped);
        currentChat.off(ClientEvents.ChannelUpdated, handleChannelUpdated);
        currentChat.off(ClientEvents.MemberJoined, handleMemberJoined);
        currentChat.off(ClientEvents.MemberAdded, handleMemberAdded);
        currentChat.off(ClientEvents.MemberRemoved, handleMemberRemoved);
        currentChat.off(ClientEvents.MemberPromoted, handleMemberPromoted);
        currentChat.off(ClientEvents.MemberDemoted, handleMemberDemoted);
        currentChat.off(ClientEvents.MemberBanned, handleMemberBanned);
        currentChat.off(ClientEvents.MemberUnBanned, handleMemberUnBanned);
        currentChat.off(ClientEvents.PollChoiceNew, handleMessages);
        currentChat.off(ClientEvents.ChannelTruncate, handleChannelTruncate);
        currentChat.off(ClientEvents.ChannelTopicEnabled, handleChannelTopicEnabled);
        currentChat.off(ClientEvents.ChannelTopicDisabled, handleChannelTopicDisabled);
        currentChat.off(ClientEvents.ChannelTopicClosed, handleChannelTopicClosed);
        currentChat.off(ClientEvents.ChannelTopicReopen, handleChannelTopicReopen);
      };
    } else {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = 0;
      }
      setMessages([]);
      setUsersTyping([]);
    }
  }, [currentChat, user_id, messageListRef]);

  useEffect(() => {
    if (messageIdError) {
      setMessages(prev => prev.filter(item => item.id !== messageIdError));
    }
  }, [messageIdError]);

  useEffect(() => {
    if (searchMessageId) {
      setHighlightMsg(searchMessageId);
      const message = messages.find(item => item.id === searchMessageId);
      if (message) {
        setTargetId(message.id);
      } else {
        queryMessages(searchMessageId);
      }
    }
  }, [searchMessageId, messages]);

  const fetchMoreMessages = async () => {
    try {
      setLoadingMore(true);
      const msgId = messages[0]?.id;

      const response = await currentChat.queryMessagesLessThanId(msgId);

      if (response && Array.isArray(response) && response.length > 0) {
        setMessages(prev => {
          return [...response, ...prev];
        });
      }
      setLoadingMore(false);
    } catch (error) {
      setLoadingMore(false);
      handleError(dispatch, error);
    }
  };

  const queryMessages = async msgId => {
    const channelType = currentChat.data.type;
    const channelId = currentChat.data.id;
    const channel = client.channel(channelType, channelId);

    const response = await channel.query({
      messages: { limit: MESSAGE_LIMIT, id_gt: msgId },
    });

    if (response) {
      const messages = channel.state.messages;

      setMessages(messages);
      setTargetId(msgId);
    }
  };

  const onScrollToReplyMsg = msgId => {
    setHighlightMsg(msgId);
    const message = messages.find(item => item.id === msgId);
    if (message) {
      setTargetId(message.id);
    } else {
      queryMessages(msgId);
    }
  };

  const onScrollToFirstUnread = () => {
    if (lastReadMessageId) {
      const message = messages.find(item => item.id === lastReadMessageId);
      if (message) {
        setTargetId(message.id);
      } else {
        queryMessages(lastReadMessageId);
      }

      setTimeout(() => {
        onDeleteUnread();
      }, 1000);
    }
  };

  const onDeleteUnread = () => {
    setShowChipUnread(false);
    setUnreadCount(0);
  };

  const onDropFiles = (acceptedFiles, fileRejections, event) => {
    event.stopPropagation();
    event.preventDefault();
    dispatch(onFilesMessage({ openDialog: true, files: acceptedFiles, uploadType: UploadType.File }));
  };

  function addDateLabels(messages) {
    let lastDate = null;
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    return messages.map((msg, idx) => {
      const msgDate = dayjs(msg.created_at).startOf('day');
      let date_label = null;

      if (!lastDate || !msgDate.isSame(lastDate)) {
        if (msgDate.isSame(today)) date_label = 'Today';
        else if (msgDate.isSame(yesterday)) date_label = 'Yesterday';
        else date_label = msgDate.format('DD/MM/YYYY');
        lastDate = msgDate;
      }

      return date_label ? { ...msg, date_label } : msg;
    });
  }

  const showChatFooter = !isGuest && !isBanned && !isClosedTopic;
  const showButtonScrollToBottom = !isBlocked || !isBanned;
  const disabledScroll = isBlocked || isBanned;
  const showTopicPanel = !isGuest && !isDirect && currentChannel?.data?.topics_enabled;

  return (
    <Stack direction="row" sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {showTopicPanel && <TopicPanel />}

      <Stack sx={{ minWidth: 'auto', height: '100%', position: 'relative', flex: 1, overflow: 'hidden' }}>
        <ChatHeader />

        {currentChat && (
          <Box
            sx={{
              width: '100%',
              position: 'absolute',
              top: '75px',
              zIndex: 2,
              padding: isMobileToLg ? '4px 20px' : isLgToXl ? '4px 50px' : '4px 90px',
            }}
          >
            {isAlertInvitePending && (
              <Box sx={{ width: '100%' }}>
                <Alert severity="info" sx={{ fontWeight: 400 }}>
                  <strong>{formatString(currentChat?.data.name)}</strong>
                  &nbsp;needs to accept your invitation to see the messages you've sent
                </Alert>
              </Box>
            )}

            <PinnedMessages />

            {(showChipUnread || unreadCount >= MESSAGE_LIMIT) && (
              <Stack direction="row" alignItems="center" justifyContent="center">
                <Chip
                  label={`${unreadCount} Unread messages`}
                  color="primary"
                  onClick={onScrollToFirstUnread}
                  onDelete={onDeleteUnread}
                />
              </Stack>
            )}
          </Box>
        )}

        <Dropzone onDrop={onDropFiles} noClick noKeyboard noDragEventsBubbling>
          {({ getRootProps, isDragActive }) => (
            <Box
              {...getRootProps()}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                minWidth: 'auto',
                minHeight: 'auto',
                flex: 1,
              }}
              className={`${isDragActive ? 'isDragActive' : ''}`}
            >
              <Box
                id="scrollableDiv"
                className="customScrollbar"
                ref={messageListRef}
                width={'100%'}
                sx={{
                  position: 'relative',
                  flexGrow: 1,
                  overflowY: disabledScroll ? 'hidden' : 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                }}
              >
                {currentChat && (
                  <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    style={{
                      display: 'flex',
                      flexDirection: 'column-reverse',
                      position: 'relative',
                      overflowX: 'hidden',
                    }}
                    inverse={true}
                    hasMore={true}
                    loader={
                      loadingMore && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                          <LoadingSpinner />
                        </div>
                      )
                    }
                    scrollableTarget="scrollableDiv"
                    scrollThreshold={0.95}
                  >
                    {/* <SimpleBarStyle timeout={500} clickOnTrack={false}> */}
                    <MessageList
                      messageListRef={messageListRef}
                      messages={addDateLabels(messages)}
                      lastReadMessageId={lastReadMessageId}
                      targetId={targetId}
                      setTargetId={setTargetId}
                      isDirect={isDirect}
                      setShowChipUnread={setShowChipUnread}
                      onScrollToReplyMsg={onScrollToReplyMsg}
                      highlightMsg={highlightMsg}
                      setHighlightMsg={setHighlightMsg}
                      currentChat={currentChat}
                    />
                    {/* </SimpleBarStyle> */}
                  </InfiniteScroll>
                )}

                {noMessageTitle && <NoMessageBox channel={currentChat} />}
              </Box>
            </Box>
          )}
        </Dropzone>

        {showButtonScrollToBottom && <ScrollToBottom messageListRef={messageListRef} />}
        {showChatFooter && (
          <Box
            sx={{
              padding: '15px',
              position: 'relative',
            }}
          >
            {usersTyping && usersTyping.length > 0 && <UsersTyping usersTyping={usersTyping} />}
            <ChatFooter setMessages={setMessages} isDialog={false} />
          </Box>
        )}
        {isClosedTopic && <ClosedTopicBackdrop />}
        {isPendingInvite && <ChannelInvitation />}
        {isBanned && <BannedBackdrop />}
        {isBlocked && <BlockedBackdrop />}
      </Stack>
      {deleteMessage.openDialog && <DeleteMessageDialog />}
      {forwardMessage.openDialog && <ForwardMessageDialog />}
      <MessagesHistoryDialog />
      {filesMessage.openDialog && <UploadFilesDialog setMessages={setMessages} />}
      <CreatePollDialog />
      <PollResultDialog />
    </Stack>
  );
};

export default ChatComponent;

export { MessageList };
