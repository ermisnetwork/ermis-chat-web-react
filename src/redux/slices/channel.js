import { createSlice } from '@reduxjs/toolkit';
import { ChatType, CurrentChannelStatus, RoleMember, SidebarType } from '../../constants/commons-const';
import { client } from '../../client';
import { handleError, isEmptyObject, myRoleInChannel, splitChannelId } from '../../utils/commons';
import { CapabilitiesName } from '../../constants/capabilities-const';
import { setSidebar } from './app';
import { FetchAllMembers } from './member';
import {
  SetCurrentTopic,
  SetIsClosedTopic,
  SetOpenTopicPanel,
  SetParentChannel,
  SetPinnedTopics,
  SetTopics,
} from './topic';
import { onEditMessage, onReplyMessage } from './messages';

const initialState = {
  activeChannels: [], // channels that user has joined or created
  pendingChannels: [], // channels that user has pending invite
  pinnedChannels: [], // channels that user has pinned
  mutedChannels: [], // channels that user has muted
  skippedChannels: [], // channels that user has skipped invite
  searchChannels: [], // data for feature search channel
  unreadChannels: [], // channels that have unread messages
  channel_id: null,
  currentChannel: null,
  allUnreadData: {},
  capabilities: [],
  channelPermissions: {
    canSendMessage: true,
    canSendLinks: true,
    canEditMessage: true,
    canDeleteMessage: true,
    canReactMessage: true,
    canPinMessage: true,
    canCreatePoll: true,
    canVotePoll: true,
  },
  cooldownTime: null,
  filterWords: [],
  mentions: [],
  currentChannelStatus: CurrentChannelStatus.IDLE,
  pinnedMessages: [],
  isBlocked: false,
  isBanned: false,
  loadingChannels: true,
  isGuest: false,
};

const slice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    fetchChannels(state, action) {
      state.activeChannels = action.payload.activeChannels;
      state.pendingChannels = action.payload.pendingChannels;
      state.mutedChannels = action.payload.mutedChannels;
      state.unreadChannels = action.payload.unreadChannels;
      state.skippedChannels = action.payload.skippedChannels;
      state.pinnedChannels = action.payload.pinnedChannels;
    },
    setActiveChannels(state, action) {
      state.activeChannels = action.payload;
    },
    updateActiveChannels(state, action) {
      const updatedChannel = action.payload;
      state.activeChannels = state.activeChannels.map(channel =>
        channel.id === updatedChannel.id ? updatedChannel : channel,
      );
    },
    updatePinnedChannels(state, action) {
      const updatedChannel = action.payload;
      state.pinnedChannels = state.pinnedChannels.map(channel =>
        channel.id === updatedChannel.id ? updatedChannel : channel,
      );
    },
    addActiveChannel(state, action) {
      state.activeChannels.unshift(action.payload);
    },
    removeActiveChannel(state, action) {
      state.activeChannels = state.activeChannels.filter(item => item.id !== action.payload);
    },
    addPendingChannel(state, action) {
      state.pendingChannels.unshift(action.payload);
    },
    removePendingChannel(state, action) {
      state.pendingChannels = state.pendingChannels.filter(item => item.id !== action.payload);
    },
    setPendingChannels(state, action) {
      state.pendingChannels = action.payload;
    },
    addPinnedChannel(state, action) {
      state.pinnedChannels.unshift(action.payload);
    },
    removePinnedChannel(state, action) {
      state.pinnedChannels = state.pinnedChannels.filter(item => item.id !== action.payload);
    },
    setPinnedChannels(state, action) {
      state.pinnedChannels = action.payload;
    },
    addMutedChannel(state, action) {
      state.mutedChannels.unshift(action.payload);
    },
    removeMutedChannel(state, action) {
      state.mutedChannels = state.mutedChannels.filter(item => item.id !== action.payload);
    },
    addSkippedChannel(state, action) {
      state.skippedChannels.unshift(action.payload);
    },
    removeSkippedChannel(state, action) {
      state.skippedChannels = state.skippedChannels.filter(item => item.id !== action.payload);
    },
    setCurrentChannel(state, action) {
      state.currentChannel = action.payload;
    },
    fetchAllUnreadData(state, action) {
      state.allUnreadData = action.payload;
    },
    setCapabilities(state, action) {
      state.capabilities = action.payload;
    },
    setChannelPermissions(state, action) {
      const {
        canSendMessage,
        canSendLinks,
        canEditMessage,
        canDeleteMessage,
        canReactMessage,
        canPinMessage,
        canCreatePoll,
        canVotePoll,
      } = action.payload;
      state.channelPermissions.canSendMessage = canSendMessage;
      state.channelPermissions.canSendLinks = canSendLinks;
      state.channelPermissions.canEditMessage = canEditMessage;
      state.channelPermissions.canDeleteMessage = canDeleteMessage;
      state.channelPermissions.canReactMessage = canReactMessage;
      state.channelPermissions.canPinMessage = canPinMessage;
      state.channelPermissions.canCreatePoll = canCreatePoll;
      state.channelPermissions.canVotePoll = canVotePoll;
    },
    setCooldownTime(state, action) {
      state.cooldownTime = action.payload;
    },
    setFilterWords(state, action) {
      state.filterWords = action.payload;
    },
    setMentions(state, action) {
      state.mentions = action.payload;
    },
    addMention(state, action) {
      const exists = state.mentions.some(item => item.id === action.payload.id);
      if (!exists) {
        state.mentions.push(action.payload);
      }
    },
    removeMention(state, action) {
      state.mentions = state.mentions.filter(item => item.id !== action.payload);
    },
    setSearchChannels(state, action) {
      state.searchChannels = action.payload;
    },
    setCurrentChannelStatus(state, action) {
      state.currentChannelStatus = action.payload;
    },
    setPinnedMessages(state, action) {
      state.pinnedMessages = action.payload;
    },
    setIsBlocked(state, action) {
      state.isBlocked = action.payload;
    },
    setIsBanned(state, action) {
      state.isBanned = action.payload;
    },
    setIsGuest(state, action) {
      state.isGuest = action.payload;
    },
    addUnreadChannel(state, action) {
      const channel = action.payload;
      const channelIdx = state.unreadChannels.findIndex(c => c.id === channel.id);

      if (channelIdx === -1) {
        // Channel chưa tồn tại, thêm mới
        state.unreadChannels.push({
          id: channel.id,
          unreadCount: channel.unreadCount || 0,
          unreadTopics: channel.unreadTopics || [],
        });
      } else {
        // Channel đã tồn tại, cập nhật unreadCount và merge unreadTopics nếu có
        const existing = state.unreadChannels[channelIdx];
        if (typeof channel.unreadCount === 'number') {
          existing.unreadCount = channel.unreadCount;
        }
        if (Array.isArray(channel.unreadTopics) && channel.unreadTopics.length > 0) {
          // Merge unreadTopics, tránh trùng lặp topic id
          const existingTopics = existing.unreadTopics || [];
          channel.unreadTopics.forEach(newTopic => {
            const idx = existingTopics.findIndex(t => t.id === newTopic.id);
            if (idx === -1) {
              existingTopics.push(newTopic);
            } else if (typeof newTopic.unreadCount === 'number') {
              existingTopics[idx].unreadCount = newTopic.unreadCount;
            }
          });
          existing.unreadTopics = existingTopics;
        }
      }
    },
    removeUnreadChannel(state, action) {
      // state.unreadChannels = state.unreadChannels.filter(item => item.id !== action.payload);
      const { channelId, topicId } = action.payload;
      if (topicId) {
        // Xóa topic trong channel
        state.unreadChannels = state.unreadChannels
          .map(item => {
            if (item.id === channelId) {
              return {
                ...item,
                unreadTopics: item.unreadTopics.filter(topic => topic.id !== topicId),
              };
            }
            return item;
          })
          .filter(item => {
            // Nếu là channel vừa xử lý, kiểm tra điều kiện để giữ lại hay xóa
            if (item.id === channelId) {
              return !(item.unreadCount === 0 && (!item.unreadTopics || item.unreadTopics.length === 0));
            }
            return true;
          });
      } else {
        // Xóa channel hoặc chỉ set unreadCount = 0 nếu còn topic
        const channelIdx = state.unreadChannels.findIndex(item => item.id === channelId);
        if (channelIdx === -1) return; // Không tìm thấy channel để xóa
        const channel = state.unreadChannels[channelIdx];
        if (channel.unreadTopics && channel.unreadTopics.length > 0) {
          // Nếu còn topic, chỉ set unreadCount = 0
          state.unreadChannels[channelIdx].unreadCount = 0;
        } else {
          // Không còn topic, xóa channel
          state.unreadChannels = state.unreadChannels.filter(item => item.id !== channelId);
        }
      }
    },
    updateUnreadChannel(state, action) {
      const channel = action.payload;
      state.unreadChannels = state.unreadChannels.map(item => (item.id === channel.id ? channel : item));
    },
    setLoadingChannels(state, action) {
      state.loadingChannels = action.payload;
    },
  },
});

// Reducer
export const { setCurrentChannel, setSearchChannels, setCurrentChannelStatus, removePinnedChannel } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

const loadDataChannel = (channel, dispatch, user_id) => {
  const channelType = channel.type;
  if (channelType !== ChatType.MESSAGING) {
    if (!channel.state.read || !channel.state.read[user_id]) {
      return;
    }

    const myRole = myRoleInChannel(channel);
    const duration = channel.data.member_message_cooldown;
    const lastSend = channel.state.read[user_id].last_send;
    const membership = channel.state.membership;
    const banned = membership?.banned ?? false;
    dispatch(SetIsBanned(banned));
    dispatch(
      SetMentions(
        Object.values(channel.state.members).filter(
          member => member.channel_role !== RoleMember.PENDING && !member.banned,
        ) || [],
      ),
    );
    dispatch(SetMemberCapabilities(channel.data?.member_capabilities));
    dispatch(SetFilterWords(channel.data.filter_words || []));
    if (myRole === RoleMember.MEMBER && duration > 0) {
      dispatch(SetCooldownTime({ duration, lastSend }));
    }

    if (channel.data?.topics_enabled) {
      dispatch(SetOpenTopicPanel(true));
      dispatch(SetParentChannel(channel));
    } else {
      dispatch(SetOpenTopicPanel(false));
    }
  } else {
    const membership = channel.state.membership;
    dispatch(SetIsBlocked(membership?.blocked ?? false));
    dispatch(SetOpenTopicPanel(false));
  }
};

const categorizeChannels = (channels, userId) => {
  return channels.reduce(
    (acc, channel) => {
      const membership = channel.state.membership;
      const channelRole = membership.channel_role;

      // Phân loại theo role
      if (channelRole === RoleMember.PENDING) {
        acc.pendingChannels.push(channel);
      } else if (channelRole === RoleMember.SKIPPED) {
        acc.skippedChannels.push(channel);
      } else {
        // Channel đã join - phân loại theo pinned
        if (channel.data.is_pinned) {
          acc.pinnedChannels.push(channel);
        } else {
          acc.activeChannels.push(channel);
        }

        // Xử lý unread messages và topics
        const read = channel.state.read[userId];
        if (read) {
          const unreadMessage = read.unread_messages;
          let unreadTopics = [];

          // Xử lý unread topics cho team channels
          if (channel.type === ChatType.TEAM && channel.data?.topics_enabled && channel.state.topics) {
            channel.state.topics.forEach(topic => {
              const topicRead = topic.state.read?.[userId];
              const topicUnread = topicRead?.unread_messages;
              if (topicUnread > 0) {
                unreadTopics.push({
                  id: topic.id,
                  unreadCount: topicUnread,
                });
              }
            });
          }

          // Thêm vào unread channels nếu có unread messages hoặc topics
          if (unreadMessage > 0 || unreadTopics.length > 0) {
            acc.unreadChannels.push({
              id: channel.id,
              unreadCount: unreadMessage,
              unreadTopics,
            });
          }
        }
      }

      // Xử lý muted channels
      if (membership.muted) {
        acc.mutedChannels.push(channel);
      }

      return acc;
    },
    {
      activeChannels: [],
      pendingChannels: [],
      mutedChannels: [],
      unreadChannels: [],
      skippedChannels: [],
      pinnedChannels: [],
    },
  );
};

export function FetchChannels(params) {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;

    const filter = {
      type: ['messaging', 'team'],
    };
    const sort = [];
    const options = {
      message_limit: 25,
    };
    dispatch(
      slice.actions.fetchChannels({
        activeChannels: [],
        pendingChannels: [],
        mutedChannels: [],
        unreadChannels: [],
        skippedChannels: [],
        pinnedChannels: [],
      }),
    );
    dispatch(slice.actions.setLoadingChannels(true));
    await client
      .queryChannels(filter, sort, options)
      .then(async response => {
        dispatch(FetchAllMembers());

        // const sortedArray = response.sort((a, b) => {
        //   const dateA = a.state.last_message_at ? new Date(a.state.last_message_at) : new Date(a.data.created_at);
        //   const dateB = b.state.last_message_at ? new Date(b.state.last_message_at) : new Date(b.data.created_at);
        //   return dateB - dateA;
        // });

        const categorizedChannels = categorizeChannels(response, user_id);
        dispatch(slice.actions.fetchChannels(categorizedChannels));
        dispatch(slice.actions.setLoadingChannels(false));
      })
      .catch(err => {
        dispatch(
          slice.actions.fetchChannels({
            activeChannels: [],
            pendingChannels: [],
            mutedChannels: [],
            skippedChannels: [],
          }),
        );
        dispatch(slice.actions.setLoadingChannels(false));
        handleError(dispatch, err, t);
      });
  };
}

export function ReFetchChannels() {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;

    const filter = {
      type: ['messaging', 'team'],
    };
    const sort = [];
    const options = {
      message_limit: 25,
    };
    await client
      .queryChannels(filter, sort, options)
      .then(async response => {
        dispatch(FetchAllMembers());

        const categorizedChannels = categorizeChannels(response, user_id);
        dispatch(slice.actions.fetchChannels(categorizedChannels));
      })
      .catch(err => {
        handleError(dispatch, err, t);
      });
  };
}

export const SetActiveChannels = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setActiveChannels(payload));
  };
};

export const SetPendingChannels = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setPendingChannels(payload));
  };
};

// export const ConnectCurrentChannel = (channelId, channelType) => {
//   return async (dispatch, getState) => {
//     try {
//       if (!client) return;
//       dispatch(SetCooldownTime(null));
//       dispatch(slice.actions.setCurrentChannel(null));
//       dispatch(SetIsBlocked(false));
//       dispatch(
//         slice.actions.setChannelPermissions({
//           canSendMessage: true,
//           canEditMessage: true,
//           canDeleteMessage: true,
//           canReactMessage: true,
//           canPinMessage: true,
//           canCreatePoll: true,
//           canVotePoll: true,
//         }),
//       );
//       dispatch(SetCurrentTopic(null));
//       dispatch(SetIsClosedTopic(false));
//       dispatch(SetTopics([]));
//       const { user_id } = getState().auth;
//       const channel = client.channel(channelType, channelId);
//       const messages = { limit: 25 };
//       const response = await channel.query({
//         messages,
//       });

//       if (response) {
//         dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ACTIVE));
//         dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
//         dispatch(slice.actions.setCurrentChannel(channel));
//         loadDataChannel(channel, dispatch, user_id);

//         if (channel.type === ChatType.TEAM && channel.data?.topics_enabled) {
//           dispatch(SetOpenTopicPanel(true));
//           dispatch(FetchTopics(channel.cid));
//         }
//       }
//     } catch (error) {
//       dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ERROR));
//     }
//   };
// };

export const ConnectCurrentChannel = (channelId, channelType) => {
  return (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;
    dispatch(ClearDataChannel());

    const channel = client.channel(channelType, channelId);

    if (isEmptyObject(channel.data)) {
      dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ERROR));
      return;
    }

    dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ACTIVE));
    dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
    dispatch(slice.actions.setCurrentChannel(channel));
    loadDataChannel(channel, dispatch, user_id);
  };
};

export const WatchCurrentChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      const { user_id } = getState().auth;
      const { currentChannel, activeChannels = [], pinnedChannels = [] } = getState().channel;
      const channel = client.channel(channelType, channelId);
      const response = await channel.watch();

      if (response) {
        if (activeChannels.some(c => c.id === channel.id)) {
          dispatch(slice.actions.updateActiveChannels(channel));
        }

        if (pinnedChannels.some(c => c.id === channel.id)) {
          dispatch(slice.actions.updatePinnedChannels(channel));
        }

        if (currentChannel && currentChannel.id === channel.id) {
          dispatch(slice.actions.setCurrentChannel(channel));
          loadDataChannel(channel, dispatch, user_id);
        }
      }
    } catch (error) {
      handleError(dispatch, error, t);
    }
  };
};

export const ClearDataChannel = () => {
  return (dispatch, getState) => {
    dispatch(SetCurrentTopic(null));
    dispatch(onReplyMessage(null));
    dispatch(onEditMessage(null));
    dispatch(SetCooldownTime(null));
    dispatch(SetIsBlocked(false));
    dispatch(
      slice.actions.setChannelPermissions({
        canSendMessage: true,
        canEditMessage: true,
        canDeleteMessage: true,
        canReactMessage: true,
        canPinMessage: true,
        canCreatePoll: true,
        canVotePoll: true,
      }),
    );
    dispatch(SetCurrentTopic(null));
    dispatch(SetIsClosedTopic(false));
    // dispatch(SetTopics([]));
    dispatch(SetParentChannel(null));
  };
};

export const AddActiveChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;

    const splitCID = splitChannelId(cid);
    const channelId = splitCID.channelId;
    const channelType = splitCID.channelType;

    const channel = client.channel(channelType, channelId);
    const response = await channel.watch();
    // const channel = client.activeChannels[cid];

    dispatch(slice.actions.addActiveChannel(channel));

    // if (eventType === ClientEvents.Notification.InviteAccepted) {
    //   dispatch(slice.actions.setCurrentChannel(channel));
    //   loadDataChannel(channel, dispatch, user_id);
    // }
  };
};

export const RemoveActiveChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeActiveChannel(channelId));
    dispatch(slice.actions.removeMutedChannel(channelId));
    dispatch(slice.actions.removeUnreadChannel(channelId));
    dispatch(slice.actions.setCurrentChannel(null));
  };
};

export const AddPendingChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;
    const channel = client.activeChannels[cid];
    dispatch(slice.actions.addPendingChannel(channel));
  };
};

export const RemovePendingChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removePendingChannel(channelId));
    dispatch(slice.actions.removeMutedChannel(channelId));
    dispatch(slice.actions.setCurrentChannel(null));
  };
};

export const AddMutedChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;
    const channel = client.activeChannels[cid];
    dispatch(slice.actions.addMutedChannel(channel));
  };
};

export const RemoveMutedChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeMutedChannel(channelId));
  };
};

export const AddSkippedChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;
    const splitCID = splitChannelId(cid);
    const channelId = splitCID.channelId;
    const channelType = splitCID.channelType;
    const channel = client.activeChannels[cid];
    dispatch(slice.actions.addSkippedChannel(channel));
    dispatch(slice.actions.removePendingChannel(channelId));
  };
};

export const RemoveSkippedChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeSkippedChannel(channelId));
  };
};

export const AddPinnedChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;
    const splitCID = splitChannelId(cid);
    const channelId = splitCID.channelId;
    const channelType = splitCID.channelType;
    const channel = client.activeChannels[cid];
    dispatch(slice.actions.addPinnedChannel(channel));
    dispatch(slice.actions.removeActiveChannel(channelId));
  };
};

export const RemovePinnedChannel = cid => {
  return async (dispatch, getState) => {
    if (!client) return;
    const splitCID = splitChannelId(cid);
    const channelId = splitCID.channelId;
    const channelType = splitCID.channelType;
    const channel = client.activeChannels[cid];
    dispatch(slice.actions.removePinnedChannel(channelId));
    dispatch(slice.actions.addActiveChannel(channel));
  };
};

export const AddUnreadChannel = channel => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addUnreadChannel(channel));
  };
};

export const RemoveUnreadChannel = (channelId, topicId) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeUnreadChannel({ channelId, topicId }));
  };
};

export const UpdateUnreadChannel = channel => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateUnreadChannel(channel));
  };
};

export const MoveChannelToTop = channelId => {
  return async (dispatch, getState) => {
    const { activeChannels, pinnedChannels } = getState().channel;
    const { topics, pinnedTopics } = getState().topic;

    // Xử lý activeChannels
    const channelIndex = activeChannels.findIndex(
      channel => channel.id === channelId || channel.state.topics?.some(topic => topic.id === channelId),
    );
    if (channelIndex > -1) {
      const channelToMove = activeChannels[channelIndex];
      const updatedChannels = [
        channelToMove,
        ...activeChannels.slice(0, channelIndex),
        ...activeChannels.slice(channelIndex + 1),
      ];
      dispatch(slice.actions.setActiveChannels(updatedChannels));
    }

    // Xử lý pinnedChannels
    const pinnedIndex = pinnedChannels.findIndex(
      channel => channel.id === channelId || channel.state.topics?.some(topic => topic.id === channelId),
    );
    if (pinnedIndex > -1) {
      const channelToMove = pinnedChannels[pinnedIndex];
      const updatedPinned = [
        channelToMove,
        ...pinnedChannels.slice(0, pinnedIndex),
        ...pinnedChannels.slice(pinnedIndex + 1),
      ];
      dispatch(slice.actions.setPinnedChannels(updatedPinned));
    }

    // Xử lý topics
    if (topics.length > 0) {
      const topicIndex = topics.findIndex(topic => topic.id === channelId);
      if (topicIndex > -1) {
        const topicToMove = topics[topicIndex];
        const updatedTopics = [topicToMove, ...topics.slice(0, topicIndex), ...topics.slice(topicIndex + 1)];
        dispatch(SetTopics(updatedTopics));
        return;
      }
    }

    // Xử lý pinnedTopics
    if (pinnedTopics.length > 0) {
      const pinnedIndex = pinnedTopics.findIndex(topic => topic.id === channelId);
      if (pinnedIndex > -1) {
        const topicToMove = pinnedTopics[pinnedIndex];
        const updatedPinned = [
          topicToMove,
          ...pinnedTopics.slice(0, pinnedIndex),
          ...pinnedTopics.slice(pinnedIndex + 1),
        ];
        dispatch(SetPinnedTopics(updatedPinned));
      }
    }
  };
};

export const SetMarkReadChannel = channel => {
  return async (dispatch, getState) => {
    const { user_id } = getState().auth;
    const read = channel.state.read[user_id];
    if (!read) return;
    const unreadMessage = read.unread_messages;
    if (unreadMessage) {
      await channel.markRead();
    }
  };
};

export function FetchAllUnreadData() {
  return async (dispatch, getState) => {
    if (!client) return;

    const userId = getState().auth.user_id;
    await client
      .getUnreadCount(userId)
      .then(response => {
        dispatch(slice.actions.fetchAllUnreadData(response));
      })
      .catch(err => {
        handleError(dispatch, err, t);
      });
  };
}

export function SetMemberCapabilities(capabilities) {
  return async (dispatch, getState) => {
    const { currentChannel } = getState().channel;

    if (currentChannel && currentChannel.type !== ChatType.MESSAGING) {
      dispatch(slice.actions.setCapabilities(capabilities));

      const membership = currentChannel.state.membership;
      if (membership.channel_role === RoleMember.MEMBER) {
        const canSendMessage = capabilities.includes(CapabilitiesName.SendMessage);
        const canSendLinks = capabilities.includes(CapabilitiesName.SendLinks);
        const canEditMessage = capabilities.includes(CapabilitiesName.UpdateOwnMessage);
        const canDeleteMessage = capabilities.includes(CapabilitiesName.DeleteOwnMessage);
        const canReactMessage = capabilities.includes(CapabilitiesName.SendReaction);
        const canPinMessage = capabilities.includes(CapabilitiesName.PinMessage);
        const canCreatePoll = capabilities.includes(CapabilitiesName.CreatePoll);
        const canVotePoll = capabilities.includes(CapabilitiesName.VotePoll);

        dispatch(
          slice.actions.setChannelPermissions({
            canSendMessage,
            canSendLinks,
            canEditMessage,
            canDeleteMessage,
            canReactMessage,
            canPinMessage,
            canCreatePoll,
            canVotePoll,
          }),
        );
      } else {
        dispatch(
          slice.actions.setChannelPermissions({
            canSendMessage: true,
            canEditMessage: true,
            canDeleteMessage: true,
            canReactMessage: true,
            canPinMessage: true,
            canCreatePoll: true,
            canVotePoll: true,
          }),
        );
      }
    }
  };
}

export const SetCooldownTime = payload => {
  return async (dispatch, getState) => {
    if (payload) {
      const { duration, lastSend } = payload;
      dispatch(slice.actions.setCooldownTime({ duration, lastSend }));
    } else {
      dispatch(slice.actions.setCooldownTime(null));
    }
  };
};

export const SetFilterWords = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setFilterWords(payload));
  };
};

export const SetMentions = payload => {
  return async (dispatch, getState) => {
    const users = client.state.users ? Object.values(client.state.users) : [];

    const mentionsData = payload
      .map(member => {
        const memberInfo = users.find(it => it.id === member.user_id);
        const name = member.user?.name ? member.user.name : memberInfo ? memberInfo.name : member.user_id;
        const avatar = member.user?.avatar ? member.user.avatar : memberInfo ? memberInfo.avatar : '';
        return {
          name,
          id: member.user_id,
          mentionName: `@${name.toLowerCase()}`,
          mentionId: `@${member.user_id}`,
          avatar,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const allData = { name: 'All', id: 'all', mentionName: `@all`, mentionId: `@all`, avatar: '' };

    dispatch(slice.actions.setMentions([allData, ...mentionsData]));
  };
};

export const AddMention = mentionId => {
  return async (dispatch, getState) => {
    const users = client.state.users ? Object.values(client.state.users) : [];

    const memberInfo = users.find(it => it.id === mentionId);
    const name = memberInfo ? memberInfo.name : mentionId;
    const mentionData = {
      name,
      id: mentionId,
      mentionName: `@${name.toLowerCase()}`,
      mentionId: `@${mentionId}`,
    };
    dispatch(slice.actions.addMention(mentionData));
  };
};

export const RemoveMention = mentionId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeMention(mentionId));
  };
};

export const SetPinnedMessages = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setPinnedMessages(payload));
  };
};

export const SetIsBlocked = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setIsBlocked(payload));
  };
};

export const SetIsBanned = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setIsBanned(payload));
  };
};

export const SetIsGuest = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setIsGuest(payload));
  };
};
