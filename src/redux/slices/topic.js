import { createSlice } from '@reduxjs/toolkit';
import { RoleMember, SidebarType } from '../../constants/commons-const';
import { client } from '../../client';
import { handleError, myRoleInChannel } from '../../utils/commons';
import { setSidebar } from './app';
import { SetMarkReadChannel } from './channel';

const initialState = {
  currentTopic: null,
  topics: [],
  pinnedTopics: [],
  loadingTopics: false,
  isClosedTopic: false,
  openTopicPanel: false,
};

const slice = createSlice({
  name: 'topic',
  initialState,
  reducers: {
    setCurrentTopic(state, action) {
      state.currentTopic = action.payload;
    },
    setTopics(state, action) {
      state.topics = action.payload;
    },
    addTopic(state, action) {
      const newTopic = action.payload;
      if (!state.topics.some(topic => topic.id === newTopic.id)) {
        state.topics.unshift(newTopic);
      }
    },
    removeTopic(state, action) {
      const topicId = action.payload;
      state.topics = state.topics.filter(topic => topic.id !== topicId);
    },
    setLoadingTopics(state, action) {
      state.loadingTopics = action.payload;
    },
    setIsClosedTopic(state, action) {
      state.isClosedTopic = action.payload;
    },
    setPinnedTopics(state, action) {
      state.pinnedTopics = action.payload;
    },
    addPinnedTopic(state, action) {
      const newPinnedTopic = action.payload;
      if (!state.pinnedTopics.some(topic => topic.id === newPinnedTopic.id)) {
        state.pinnedTopics.unshift(newPinnedTopic);
      }
    },
    removePinnedTopic(state, action) {
      const topicId = action.payload;
      state.pinnedTopics = state.pinnedTopics.filter(topic => topic.id !== topicId);
    },
    setOpenTopicPanel(state, action) {
      state.openTopicPanel = action.payload;
    },
  },
});

export default slice.reducer;

// ----------------------------------------------------------------------

const watchTopic = async topicId => {
  try {
    if (!client) return;
    const topic = client.channel('topic', topicId);
    const response = await topic.watch();

    if (response) {
      return topic;
    }
  } catch (error) {
    handleError(dispatch, error);
    return null;
  }
};

export const FetchTopics = channelCID => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;

      const filter = {
        type: ['topic'],
        parent_cid: channelCID,
        // include_parent: true,
      };
      const sort = [];
      const options = {
        message_limit: 25,
      };
      dispatch(SetLoadingTopics(true));
      const response = await client.queryChannels(filter, sort, options);

      const { topics, pinnedTopics } = response.reduce(
        (acc, topic) => {
          if (topic.data.is_pinned) {
            acc.pinnedTopics.push(topic);
          } else {
            acc.topics.push(topic);
          }
          return acc;
        },
        {
          topics: [],
          pinnedTopics: [],
        },
      );

      dispatch(SetTopics(topics));
      dispatch(SetPinnedTopics(pinnedTopics));
      dispatch(SetLoadingTopics(false));
    } catch (error) {
      dispatch(SetLoadingTopics(false));
    }
  };
};

export const ConnectCurrentTopic = topicId => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      // dispatch(slice.actions.setCurrentTopic(null));
      dispatch(SetIsClosedTopic(false));
      const { user_id } = getState().auth;
      const topic = client.channel('topic', topicId);
      const messages = { limit: 25 };
      const response = await topic.query({
        messages,
      });

      if (response) {
        dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
        dispatch(slice.actions.setCurrentTopic(topic));
        dispatch(SetIsClosedTopic(topic.data?.is_closed_topic ?? false));

        const myRole = myRoleInChannel(topic);
        if (![RoleMember.PENDING, RoleMember.SKIPPED].includes(myRole)) {
          setTimeout(() => {
            dispatch(SetMarkReadChannel(topic));
          }, 100);
        }
      }
    } catch (error) {}
  };
};

export const SetCurrentTopic = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setCurrentTopic(payload));
  };
};

export const SetTopics = topics => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setTopics(topics));
  };
};

export const AddTopic = topicId => {
  return async (dispatch, getState) => {
    const topicCID = `topic:${topicId}`;
    const topic = client.activeChannels[topicCID];
    if (topic) {
      dispatch(slice.actions.addTopic(topic));
      return;
    } else {
      const topic = await watchTopic(topicId);
      if (topic) {
        dispatch(slice.actions.addTopic(topic));
      }
    }
  };
};

export const RemoveTopic = topicId => {
  return (dispatch, getState) => {
    dispatch(slice.actions.removeTopic(topicId));
    dispatch(slice.actions.removePinnedTopic(topicId));
  };
};

export const SetLoadingTopics = loading => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setLoadingTopics(loading));
  };
};

export const SetIsClosedTopic = isClosed => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setIsClosedTopic(isClosed));
  };
};

export const SetPinnedTopics = pinnedTopics => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setPinnedTopics(pinnedTopics));
  };
};

export const AddPinnedTopic = topicId => {
  return async (dispatch, getState) => {
    const topicCID = `topic:${topicId}`;
    const topic = client.activeChannels[topicCID];

    dispatch(slice.actions.addPinnedTopic(topic));
    dispatch(slice.actions.removeTopic(topicId));
  };
};

export const RemovePinnedTopic = topicId => {
  return async (dispatch, getState) => {
    const topicCID = `topic:${topicId}`;
    const topic = client.activeChannels[topicCID];
    dispatch(slice.actions.removePinnedTopic(topicId));
    dispatch(slice.actions.addTopic(topic));
  };
};

export const SetOpenTopicPanel = isOpen => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setOpenTopicPanel(isOpen));
  };
};
