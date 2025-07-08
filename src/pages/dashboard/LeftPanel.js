import React, { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import {
  AddActiveChannel,
  AddPendingChannel,
  AddPinnedChannel,
  FetchChannels,
  MoveChannelToTop,
  RemoveActiveChannel,
  RemoveMutedChannel,
  RemovePendingChannel,
  RemovePinnedChannel,
} from '../../redux/slices/channel';
import { ClientEvents } from '../../constants/events-const';
import { getChannelName, getMemberInfo } from '../../utils/commons';
import Logo from '../../assets/Images/logo.svg';
import { DEFAULT_PATH, DOMAIN_APP } from '../../config';
import { ChatType, EMOJI_QUICK, MessageType, TabType } from '../../constants/commons-const';
import { UpdateTab } from '../../redux/slices/app';
import { convertMessageSystem } from '../../utils/messageSystem';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { convertLastMessageSignal } from '../../utils/messageSignal';
import { UpdateMember } from '../../redux/slices/member';
import Contacts from './Contacts';
import Channels from './Channels';

const LeftPanel = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const navigate = useNavigate();
  const { tab } = useSelector(state => state.app);
  const { activeChannels, pendingChannels, mutedChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const users = client.state.users ? Object.values(client.state.users) : [];

  useEffect(() => {
    dispatch(FetchChannels());
  }, []);

  useEffect(() => {
    client?.connectToSSE(data => {
      dispatch(UpdateMember(data));
    });
  }, [client]);

  useEffect(() => {
    const currentState = window.history.state;
    const { channelId, channelType, type } = currentState;

    if (channelId && channelType && type) {
      switch (type) {
        case ClientEvents.MessageNew:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.ChannelCreated:
          dispatch(UpdateTab({ tab: TabType.Invite }));
          break;
        case ClientEvents.ReactionNew:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MemberAdded:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MemberUnBanned:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MessageUpdated:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        default:
          break;
      }

      window.history.replaceState({}, `${DOMAIN_APP}${DEFAULT_PATH}`);
    }

    return () => {
      window.history.replaceState({}, `${DOMAIN_APP}${DEFAULT_PATH}`);
    };
  }, []);

  function truncateMessage(message, maxLength) {
    if (message.length > maxLength) {
      return message.substring(0, maxLength) + '...';
    }
    return message;
  }

  function sendNotification(data) {
    const { channelId, channelType, channelName, type, notiText } = data;

    const formattedTimestamp = dayjs().format('DD/MM/YYYY, HH:mm');
    const truncatedBody = truncateMessage(notiText, 73); // Giới hạn 2 dòng cho body;

    const notification = new Notification(`${channelName} - ${formattedTimestamp}`, {
      icon: Logo,
      body: truncatedBody,
    });

    notification.addEventListener('click', function (event) {
      event.preventDefault();

      const url = `${DOMAIN_APP}/channels`;
      window.history.pushState({ channelId, channelType, type }, '', url);
      window.focus();
      window.location.href = url;
    });
  }

  function notifyUser(notiData) {
    const { type, message, senderId, channel } = notiData;
    const senderInfo = getMemberInfo(senderId, users);
    const senderName = senderInfo ? senderInfo.name : '';
    const channelData = client.channel(channel.type, channel.id);
    const channelName = getChannelName(channelData, users);
    const isDirect = channel.type === ChatType.MESSAGING;
    const isNotify = true;

    let notiText = '';
    switch (type) {
      case ClientEvents.MessageNew:
        const replaceMentionsWithNames = inputValue => {
          users.forEach(user => {
            inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
          });
          return inputValue;
        };

        if (message.type === MessageType.System) {
          notiText = convertMessageSystem(message.text, users, isDirect, isNotify);
        } else {
          if (message.attachments) {
            const getAttachmentMessage = attachments => {
              if (!attachments?.length) return '';

              const counts = attachments.reduce((acc, { type }) => ((acc[type] = (acc[type] || 0) + 1), acc), {});
              const { image = 0, video = 0, file = 0, voiceRecording = 0, linkPreview = 0 } = counts;

              if (attachments.length === 1) {
                const typeMap = {
                  file: 'a file',
                  image: 'a photo',
                  video: 'a video',
                  voiceRecording: 'a voice recording',
                  linkPreview: 'a link preview',
                };
                return `${senderName} sent ${typeMap[attachments[0].type] || 'an attachment'}`;
              }

              if (image && video && !file && !voiceRecording && !linkPreview) {
                return `${senderName} sent ${image + video} photos and videos`;
              }

              return `${senderName} sent ${attachments.length} files`;
            };
            notiText = getAttachmentMessage(message.attachments);
            // notiText = `${senderName} has sent you an attachment`;
          } else {
            if (message.mentioned_all) {
              notiText = `${senderName} mentioned everyone in ${channelName}: ${message.text}`;
            } else if (message.mentioned_users && message.mentioned_users.includes(user_id)) {
              const messagePreview = replaceMentionsWithNames(message.text);
              notiText = `You were mentioned by ${senderName} in ${channelName}: ${messagePreview}`;
            } else {
              notiText = replaceMentionsWithNames(message.text);
            }
          }
        }
        break;
      case ClientEvents.ChannelCreated:
        notiText = message.text;
        break;
      case ClientEvents.ReactionNew:
        notiText = `${senderName} reacted with ${message.emoji.value} to your message`;
        break;
      case ClientEvents.MemberBanned:
        notiText = message.text;
        break;
      case ClientEvents.MemberUnBanned:
        notiText = message.text;
        break;
      case ClientEvents.MessageUpdated:
        notiText =
          message.type === MessageType.System
            ? convertMessageSystem(message.text, users, isDirect, isNotify)
            : message.type === MessageType.Signal
              ? convertLastMessageSignal(message.text)
              : message.text;
        break;
      case ClientEvents.MemberAdded:
        notiText = message.text;
        break;
      default:
        notiText = '';
        break;
    }

    const data = {
      channelId: channel.id,
      channelType: channel.type,
      channelName: channelName,
      type,
      notiText,
    };

    if (!('Notification' in window)) {
      alert('This browser does not support system notifications!');
    } else if (Notification.permission === 'granted') {
      sendNotification(data);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(permission => {
        if (permission === 'granted') {
          sendNotification(data);
        }
      });
    }
  }

  useEffect(() => {
    if (client) {
      const handleMessageNew = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(MoveChannelToTop(channelId));

        let isPushNoti = false; // Mặc định không gửi thông báo đẩy

        // Kiểm tra nếu tin nhắn đến từ người khác và kênh không bị tắt tiếng
        if (event.user.id !== user_id && !mutedChannels.some(item => item.id === channelId)) {
          // Push noti nếu:
          // - Tin nhắn không phải là loại Signal
          // - Hoặc nếu là tin nhắn System nhưng không chứa "11 {event.user.id}"
          isPushNoti =
            event.message.type !== MessageType.Signal &&
            !(event.message.type === MessageType.System && event.message.text.includes(`11 ${event.user.id}`));
        }

        if (isPushNoti) {
          const notiData = {
            type: ClientEvents.MessageNew,
            message: event.message,
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);
        }
      };

      const handleChannelCreated = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        if (user_id === event.user.id) {
          // lời mời mình gửi
          dispatch(AddActiveChannel(event.cid, event.type));
        } else {
          // lời mời mình nhận
          const notiData = {
            type: ClientEvents.ChannelCreated,
            message: {
              text:
                event.channel_type === ChatType.TEAM
                  ? 'You have a new channel invitation'
                  : 'You have a new DM invitation',
            },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);

          dispatch(AddPendingChannel(event.cid));
        }
      };

      const handleChannelDeleted = event => {
        navigate(`${DEFAULT_PATH}`);
        if (activeChannels.some(item => item.id === event.channel_id)) {
          dispatch(RemoveActiveChannel(event.channel_id));
        }
        if (pendingChannels.some(item => item.id === event.channel_id)) {
          dispatch(RemovePendingChannel(event.channel_id));
        }

        if (mutedChannels.some(item => item.id === event.channel_id)) {
          dispatch(RemoveMutedChannel(event.channel_id));
        }
      };

      const handleReactionNew = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        const isMyMessage = event.message.user.id === user_id;

        if (isMyMessage && event.user.id !== user_id) {
          const emoji = EMOJI_QUICK.find(item => item.type === event.reaction.type);

          const notiData = {
            type: ClientEvents.ReactionNew,
            message: { emoji },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          if (!mutedChannels.some(item => item.id === channelId)) {
            notifyUser(notiData);
          }
        }
      };

      const handleBanned = event => {
        if (event.member.user_id === user_id) {
          const channelId = event.channel_id;
          const channelType = event.channel_type;
          const notiData = {
            type: ClientEvents.MemberBanned,
            message: { text: `You have been banned from interacting in a channel` },
            senderId: '',
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          if (!mutedChannels.some(item => item.id === channelId)) {
            notifyUser(notiData);
          }
        }
      };

      const handleUnBanned = event => {
        if (event.member.user_id === user_id) {
          const channelId = event.channel_id;
          const channelType = event.channel_type;

          const notiData = {
            type: ClientEvents.MemberBanned,
            message: { text: `You have been unbanned in a channel` },
            senderId: '',
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          if (!mutedChannels.some(item => item.id === channelId)) {
            notifyUser(notiData);
          }
        }
      };

      const handleMessageUpdated = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;

        const notiData = {
          type: ClientEvents.MessageUpdated,
          message: event.message,
          senderId: event.user.id,
          channel: {
            id: channelId,
            type: channelType,
          },
        };

        if (!mutedChannels.some(item => item.id === channelId)) {
          notifyUser(notiData);
        }
      };

      const handleMemberAdded = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;

        if (user_id === event.member.user_id) {
          // lời mời mình nhận
          const notiData = {
            type: ClientEvents.MemberAdded,
            message: {
              text:
                channelType === ChatType.TEAM ? 'You have a new channel invitation' : 'You have a new DM invitation',
            },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          if (!mutedChannels.some(item => item.id === channelId)) {
            notifyUser(notiData);
          }

          dispatch(AddPendingChannel(event.cid));
        }
      };

      const handleChannelPinned = event => {
        dispatch(AddPinnedChannel(event.cid));
      };
      const handleChannelUnPinned = event => {
        dispatch(RemovePinnedChannel(event.cid));
      };

      client.on(ClientEvents.ChannelCreated, handleChannelCreated);
      client.on(ClientEvents.ChannelDeleted, handleChannelDeleted);
      client.on(ClientEvents.MessageNew, handleMessageNew);
      client.on(ClientEvents.ReactionNew, handleReactionNew);
      client.on(ClientEvents.MemberBanned, handleBanned);
      client.on(ClientEvents.MemberUnBanned, handleUnBanned);
      client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.on(ClientEvents.MemberAdded, handleMemberAdded);
      client.on(ClientEvents.ChannelPinned, handleChannelPinned);
      client.on(ClientEvents.ChannelUnPinned, handleChannelUnPinned);

      return () => {
        client.off(ClientEvents.ChannelCreated, handleChannelCreated);
        client.off(ClientEvents.ChannelDeleted, handleChannelDeleted);
        client.off(ClientEvents.MessageNew, handleMessageNew);
        client.off(ClientEvents.ReactionNew, handleReactionNew);
        client.off(ClientEvents.MemberBanned, handleBanned);
        client.off(ClientEvents.MemberUnBanned, handleUnBanned);
        client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
        client.off(ClientEvents.MemberAdded, handleMemberAdded);
        client.off(ClientEvents.ChannelPinned, handleChannelPinned);
        client.off(ClientEvents.ChannelUnPinned, handleChannelUnPinned);
      };
    }
  }, [dispatch, user_id, client, mutedChannels, activeChannels, pendingChannels]);

  useEffect(() => {
    if (mutedChannels) {
      const timeouts = mutedChannels.map(channel => {
        const muteTimestamp = dayjs(channel.state.membership?.muted).valueOf();
        const timeRemaining = muteTimestamp - Date.now();

        // Kiểm tra nếu muteTimestamp không hợp lệ
        if (!muteTimestamp) {
          return null;
        }

        // Nếu thời gian mute đã hết, xóa channel ngay lập tức
        if (timeRemaining <= 0) {
          dispatch(RemoveMutedChannel(channel.id));
          return null;
        }

        return setTimeout(() => {
          dispatch(RemoveMutedChannel(channel.id));
        }, timeRemaining);
      });

      return () => {
        timeouts.forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
      };
    }
  }, [mutedChannels]);

  const renderedTabs = useMemo(() => {
    return (
      <>
        {tab === TabType.Chat && <Channels />}
        {tab === TabType.Contact && <Contacts />}
      </>
    );
  }, [tab]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          // backgroundColor: theme.palette.background.default,
          // boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        {renderedTabs}
      </Box>
    </>
  );
};

export default LeftPanel;
