import { createSlice } from '@reduxjs/toolkit';
import { ChatType, CurrentChannelStatus, RoleMember, SidebarType } from '../../constants/commons-const';
import { client } from '../../client';
import { handleError, myRoleInChannel, splitChannelId } from '../../utils/commons';
import { CapabilitiesName } from '../../constants/capabilities-const';
import { setSidebar } from './app';
import { ClientEvents } from '../../constants/events-const';
import { FetchAllMembers } from './member';

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
      state.mentions.push(action.payload);
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
    setIsGuest(state, action) {
      state.isGuest = action.payload;
    },
    addUnreadChannel(state, action) {
      const exists = state.unreadChannels.some(c => c.id === action.payload.id);
      if (!exists) {
        state.unreadChannels.push(action.payload);
      }
    },
    removeUnreadChannel(state, action) {
      state.unreadChannels = state.unreadChannels.filter(item => item.id !== action.payload);
    },
    updateUnreadChannel(state, action) {
      state.unreadChannels = state.unreadChannels.map(item => {
        if (item.id === action.payload.id) {
          return action.payload;
        } else {
          return item;
        }
      });
    },
    setLoadingChannels(state, action) {
      state.loadingChannels = action.payload;
    },
  },
});

// Reducer
export const { setCurrentChannel, setSearchChannels, setCurrentChannelStatus } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

const loadDataChannel = (channel, dispatch, user_id) => {
  if (channel.state.pinnedMessages) {
    dispatch(SetPinnedMessages(channel.state.pinnedMessages.reverse()));
  }

  const channelType = channel.type;
  if (channelType !== ChatType.MESSAGING) {
    const myRole = myRoleInChannel(channel);
    const duration = channel.data.member_message_cooldown;
    const lastSend = channel.state.read[user_id].last_send;
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
  } else {
    const membership = channel.state.membership;
    dispatch(SetIsBlocked(membership?.blocked ?? false));
  }
};

export function FetchChannels(params) {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;

    const filter = {};
    const sort = [];
    const options = {
      message_limit: 25,
    };
    dispatch(slice.actions.fetchChannels({ activeChannels: [], pendingChannels: [] }));

    await client
      .queryChannels(filter, sort, options)
      .then(async response => {
        dispatch(FetchAllMembers());

        const sortedArray = response.sort((a, b) => {
          const dateA = a.state.last_message_at ? new Date(a.state.last_message_at) : new Date(a.data.created_at);
          const dateB = b.state.last_message_at ? new Date(b.state.last_message_at) : new Date(b.data.created_at);
          return dateB - dateA;
        });

        const { activeChannels, pendingChannels, mutedChannels, unreadChannels, skippedChannels, pinnedChannels } =
          sortedArray.reduce(
            (acc, channel) => {
              if (channel.state.membership.channel_role === RoleMember.PENDING) {
                acc.pendingChannels.push(channel);
              } else if (channel.state.membership.channel_role === RoleMember.SKIPPED) {
                acc.skippedChannels.push(channel);
              } else {
                if (channel.data.is_pinned) {
                  acc.pinnedChannels.push(channel);
                } else {
                  acc.activeChannels.push(channel);
                }

                const read = channel.state.read[user_id];
                const unreadMessage = read.unread_messages;
                if (unreadMessage > 0) {
                  acc.unreadChannels.push({ id: channel.id, unreadCount: unreadMessage, type: channel.type });
                }
              }

              if (channel.state.membership.muted) {
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

        dispatch(
          slice.actions.fetchChannels({
            activeChannels,
            pendingChannels,
            mutedChannels,
            unreadChannels,
            skippedChannels,
            pinnedChannels,
          }),
        );
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
        handleError(dispatch, err);
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

export const ConnectCurrentChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      dispatch(SetCooldownTime(null));
      dispatch(slice.actions.setCurrentChannel(null));
      dispatch(slice.actions.setPinnedMessages([]));
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
      const { user_id } = getState().auth;
      const channel = client.channel(channelType, channelId);
      // const read = channel.state.read[user_id];
      // const lastMessageId =
      //   read && read.unread_messages > 0 && read.last_read_message_id ? read.last_read_message_id : '';

      const messages = { limit: 25 };
      // if (lastMessageId) {
      //   messages.id_gt = lastMessageId;
      // }

      // await channel.watch();
      const response = await channel.query({
        messages,
      });

      if (response) {
        dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ACTIVE));
        dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
        dispatch(slice.actions.setCurrentChannel(channel));
        loadDataChannel(channel, dispatch, user_id);

        const myRole = myRoleInChannel(channel);
        if (![RoleMember.PENDING, RoleMember.SKIPPED].includes(myRole)) {
          setTimeout(() => {
            dispatch(SetMarkReadChannel(channel));
          }, 100);
        }
      }
    } catch (error) {
      dispatch(slice.actions.setCurrentChannelStatus(CurrentChannelStatus.ERROR));
    }
  };
};

export const WatchCurrentChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      const { user_id } = getState().auth;
      const channel = client.channel(channelType, channelId);
      const response = await channel.watch();

      if (response) {
        dispatch(slice.actions.setCurrentChannel(channel));
        loadDataChannel(channel, dispatch, user_id);
        dispatch(slice.actions.updateActiveChannels(channel));
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };
};

export const AddActiveChannel = (cid, eventType) => {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;
    const channel = client.activeChannels[cid];

    dispatch(slice.actions.addActiveChannel(channel));

    if (eventType === ClientEvents.Notification.InviteAccepted) {
      dispatch(slice.actions.setCurrentChannel(channel));
      loadDataChannel(channel, dispatch, user_id);
    }
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

export const AddUnreadChannel = (channelId, unreadCount, channelType) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addUnreadChannel({ id: channelId, unreadCount, type: channelType }));
  };
};

export const RemoveUnreadChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeUnreadChannel(channelId));
  };
};

export const UpdateUnreadChannel = (channelId, unreadCount, channelType) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateUnreadChannel({ id: channelId, unreadCount, type: channelType }));
  };
};

export const MoveChannelToTop = channelId => {
  return async (dispatch, getState) => {
    const { activeChannels, pinnedChannels } = getState().channel;

    // Xử lý activeChannels
    const channelIndex = activeChannels.findIndex(channel => channel.id === channelId);
    if (channelIndex > -1) {
      const channelToMove = activeChannels[channelIndex];
      const updatedChannels = [
        channelToMove,
        ...activeChannels.slice(0, channelIndex),
        ...activeChannels.slice(channelIndex + 1),
      ];
      dispatch(slice.actions.setActiveChannels(updatedChannels));
      return; // Nếu đã tìm thấy ở activeChannels thì không cần tìm ở pinnedChannels nữa
    }

    // Xử lý pinnedChannels
    const pinnedIndex = pinnedChannels.findIndex(channel => channel.id === channelId);
    if (pinnedIndex > -1) {
      const channelToMove = pinnedChannels[pinnedIndex];
      const updatedPinned = [
        channelToMove,
        ...pinnedChannels.slice(0, pinnedIndex),
        ...pinnedChannels.slice(pinnedIndex + 1),
      ];
      dispatch(slice.actions.setPinnedChannels(updatedPinned));
    }
  };
};

export const SetMarkReadChannel = channel => {
  return async (dispatch, getState) => {
    const { user_id } = getState().auth;
    const read = channel.state.read[user_id];
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
        handleError(dispatch, err);
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

export const SetIsGuest = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setIsGuest(payload));
  };
};
