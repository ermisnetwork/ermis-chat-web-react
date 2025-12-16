import React, { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import {
  AddActiveChannel,
  AddPendingChannel,
  AddPinnedChannel,
  AddSkippedChannel,
  FetchChannels,
  MoveChannelToTop,
  RemoveActiveChannel,
  RemoveMutedChannel,
  RemovePendingChannel,
  removePinnedChannel,
  RemovePinnedChannel,
  RemoveSkippedChannel,
  WatchCurrentChannel,
} from '../../redux/slices/channel';
import { ClientEvents } from '../../constants/events-const';
import { getChannelName, getMemberInfo, splitChannelId } from '../../utils/commons';
import Logo from '../../assets/Images/logo.svg';
import { DEFAULT_PATH, DOMAIN_APP } from '../../config';
import { ChatType, EMOJI_QUICK, MessageType, TabType } from '../../constants/commons-const';
import { convertMessageSystem } from '../../utils/messageSystem';
import dayjs from 'dayjs';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { convertMessageSignal } from '../../utils/messageSignal';
import { UpdateMember } from '../../redux/slices/member';
import Channels from './Channels';
import SidebarContacts from './SidebarContacts';
import { useTranslation } from 'react-i18next';
import { AddTopic, RemovePinnedTopic, RemoveTopic, SetCurrentTopic, UpdateTopic } from '../../redux/slices/topic';

const LeftPanel = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useSelector(state => state.app);
  const {
    activeChannels = [],
    pendingChannels = [],
    mutedChannels = [],
    pinnedChannels = [],
  } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { currentTopic } = useSelector(state => state.topic);
  const users = client.state.users ? Object.values(client.state.users) : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const currentChannelId = id;

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
          navigate(`${DEFAULT_PATH}`);
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
          notiText = convertMessageSystem(message.text, users, isDirect, isNotify, t);
        } else {
          if (message.attachments) {
            const getAttachmentMessage = attachments => {
              if (!attachments?.length) return '';

              const counts = attachments.reduce((acc, { type }) => ((acc[type] = (acc[type] || 0) + 1), acc), {});
              const { image = 0, video = 0, file = 0, voiceRecording = 0, linkPreview = 0 } = counts;

              if (attachments.length === 1) {
                const typeMap = {
                  file: t('leftPanel.file'),
                  image: t('leftPanel.photo'),
                  video: t('leftPanel.video'),
                  voiceRecording: t('leftPanel.voiceRecording'),
                  linkPreview: t('leftPanel.linkPreview'),
                };
                return `${senderName} ${t('leftPanel.sent')} ${typeMap[attachments[0].type] || 'an attachment'}`;
              }

              if (image && video && !file && !voiceRecording && !linkPreview) {
                return `${senderName} ${t('leftPanel.sent')} ${image + video} ${t('leftPanel.photo_videos')}`;
              }

              return `${senderName} ${t('leftPanel.sent')} ${attachments.length} ${t('leftPanel.files')}`;
            };
            notiText = getAttachmentMessage(message.attachments);
            // notiText = `${senderName} has sent you an attachment`;
          } else {
            if (message.mentioned_all) {
              notiText = `${senderName} ${t('leftPanel.mention_all')} ${channelName}: ${message.text}`;
            } else if (message.mentioned_users && message.mentioned_users.includes(user_id)) {
              const messagePreview = replaceMentionsWithNames(message.text);
              notiText = `${t('leftPanel.mentioned_by')} ${senderName} in ${channelName}: ${messagePreview}`;
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
        notiText = `${senderName} ${t('leftPanel.reacted')} ${message.emoji.value} ${t('leftPanel.your_message')}`;
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
            ? convertMessageSystem(message.text, users, isDirect, isNotify, t)
            : message.type === MessageType.Signal
              ? convertMessageSignal(message.text, t).text || ''
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
      alert(t('leftPanel.alert'));
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
          dispatch(AddActiveChannel(event.cid));
        } else {
          // lời mời mình nhận
          const notiData = {
            type: ClientEvents.ChannelCreated,
            message: {
              text: event.channel_type === ChatType.TEAM ? t('leftPanel.chat_type_team') : t('leftPanel.chat_type_dm'),
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
        if (event.channel_type !== ChatType.TOPIC) {
          navigate(`${DEFAULT_PATH}`);
          if (activeChannels.some(item => item.id === event.channel_id)) {
            dispatch(RemoveActiveChannel(event.channel_id));
          }
          if (pendingChannels.some(item => item.id === event.channel_id)) {
            dispatch(RemovePendingChannel(event.channel_id));
          }
          if (pinnedChannels.some(item => item.id === event.channel_id)) {
            dispatch(removePinnedChannel(event.channel_id));
          }
          if (mutedChannels.some(item => item.id === event.channel_id)) {
            dispatch(RemoveMutedChannel(event.channel_id));
          }
        } else {
          dispatch(RemovePinnedTopic(event.channel_id));
          dispatch(RemoveTopic(event.channel_id));

          const topicIdFromQuery = searchParams.get('topicId');
          if (currentTopic && topicIdFromQuery && currentTopic?.id === topicIdFromQuery) {
            dispatch(SetCurrentTopic(null));
            searchParams.delete('topicId');
            setSearchParams(searchParams, { replace: true });
          }
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
            message: { text: `${t('leftPanel.member_banned')}}` },
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
            message: { text: `${t('leftPanel.member_unbanned')}` },
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
              text: channelType === ChatType.TEAM ? t('leftPanel.chat_type_team') : t('leftPanel.chat_type_dm'),
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
        } else {
          // lời mời mình gửi
          dispatch(WatchCurrentChannel(channelId, channelType));
        }
      };

      const handleChannelPinned = event => {
        if (event.channel_type !== ChatType.TOPIC) {
          dispatch(AddPinnedChannel(event.cid));
        }
      };
      const handleChannelUnPinned = event => {
        if (event.channel_type !== ChatType.TOPIC) {
          dispatch(RemovePinnedChannel(event.cid));
        }
      };

      const handleInviteReject = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        if (event.member.user_id === user_id) {
          dispatch(RemovePendingChannel(channelId));
        }
      };

      const handleInviteAccept = async event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;

        if (event.member.user_id === user_id) {
          dispatch(RemovePendingChannel(channelId));
          dispatch(RemoveSkippedChannel(channelId));
          dispatch(AddActiveChannel(event.cid));
        }
      };

      const handleInviteSkipped = async event => {
        if (event.member.user_id === user_id) {
          dispatch(AddSkippedChannel(event.cid));
        }
      };

      const handleChannelTopicEnabled = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleChannelTopicDisabled = event => {
        const topicIdFromQuery = searchParams.get('topicId');
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;
        dispatch(WatchCurrentChannel(channelId, channelType));

        if (currentTopic && topicIdFromQuery && currentTopic?.id === topicIdFromQuery) {
          dispatch(SetCurrentTopic(null));
          searchParams.delete('topicId');
          setSearchParams(searchParams, { replace: true });
        }
      };

      const handleChannelTopicCreated = event => {
        const splitParentCID = splitChannelId(event.parent_cid);
        const parentChannelId = splitParentCID.channelId;
        const parentChannelType = splitParentCID.channelType;

        const activeChannel = activeChannels.find(c => c.id === parentChannelId);
        const pinnedChannel = pinnedChannels.find(c => c.id === parentChannelId);
        const channel = activeChannel || pinnedChannel;

        if (channel) {
          dispatch(WatchCurrentChannel(parentChannelId, parentChannelType));

          if (currentChannelId === parentChannelId) {
            dispatch(AddTopic(event.channel_id));
          }
        }
      };

      const handleChannelTopicUpdated = event => {
        dispatch(UpdateTopic(event.cid));
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

      client.on(ClientEvents.ChannelCreated, handleChannelCreated);
      client.on(ClientEvents.ChannelDeleted, handleChannelDeleted);
      client.on(ClientEvents.MessageNew, handleMessageNew);
      client.on(ClientEvents.ReactionNew, handleReactionNew);
      client.on(ClientEvents.MemberBanned, handleBanned);
      client.on(ClientEvents.MemberUnBanned, handleUnBanned);
      client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.on(ClientEvents.MemberAdded, handleMemberAdded);
      client.on(ClientEvents.MemberRemoved, handleMemberRemoved);
      client.on(ClientEvents.ChannelPinned, handleChannelPinned);
      client.on(ClientEvents.ChannelUnPinned, handleChannelUnPinned);
      client.on(ClientEvents.Notification.InviteRejected, handleInviteReject);
      client.on(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
      client.on(ClientEvents.Notification.InviteSkipped, handleInviteSkipped);
      client.on(ClientEvents.ChannelTopicEnabled, handleChannelTopicEnabled);
      client.on(ClientEvents.ChannelTopicDisabled, handleChannelTopicDisabled);
      client.on(ClientEvents.ChannelTopicCreated, handleChannelTopicCreated);
      client.on(ClientEvents.ChannelTopicUpdated, handleChannelTopicUpdated);

      return () => {
        client.off(ClientEvents.ChannelCreated, handleChannelCreated);
        client.off(ClientEvents.ChannelDeleted, handleChannelDeleted);
        client.off(ClientEvents.MessageNew, handleMessageNew);
        client.off(ClientEvents.ReactionNew, handleReactionNew);
        client.off(ClientEvents.MemberBanned, handleBanned);
        client.off(ClientEvents.MemberUnBanned, handleUnBanned);
        client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
        client.off(ClientEvents.MemberAdded, handleMemberAdded);
        client.off(ClientEvents.MemberRemoved, handleMemberRemoved);
        client.off(ClientEvents.ChannelPinned, handleChannelPinned);
        client.off(ClientEvents.ChannelUnPinned, handleChannelUnPinned);
        client.off(ClientEvents.Notification.InviteRejected, handleInviteReject);
        client.off(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
        client.off(ClientEvents.Notification.InviteSkipped, handleInviteSkipped);
        client.off(ClientEvents.ChannelTopicEnabled, handleChannelTopicEnabled);
        client.off(ClientEvents.ChannelTopicDisabled, handleChannelTopicDisabled);
        client.off(ClientEvents.ChannelTopicCreated, handleChannelTopicCreated);
        client.off(ClientEvents.ChannelTopicUpdated, handleChannelTopicUpdated);
      };
    }
  }, [
    dispatch,
    user_id,
    client,
    mutedChannels,
    activeChannels,
    pendingChannels,
    pinnedChannels,
    users.length,
    currentTopic,
    searchParams,
    currentChannelId,
  ]);

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
        {tab === TabType.Contact && <SidebarContacts />}
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
        }}
      >
        {renderedTabs}
      </Box>
    </>
  );
};

export default LeftPanel;
