import { createSlice } from '@reduxjs/toolkit';
import { UpdateIsLoading, showSnackbar } from './app';
import { CloseDialogProfile } from './dialog';
import { handleError } from '../../utils/commons';
import { client } from '../../client';

const initialState = {
  all_members: [],
  myUserInfo: {},
  friend_ids: [],
  mention: {
    anchorEl: null,
    members: [],
    selectedIndex: 0,
    mentionIds: [],
  },
};

const slice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    fetchAllMembers(state, action) {
      state.all_members = action.payload;
    },
    updateMember(state, action) {
      const data = action.payload;

      state.all_members = state.all_members.map(item => {
        if (item.id === data.id) {
          return { ...item, ...data };
        } else {
          return item;
        }
      });
    },
    fetchUser(state, action) {
      state.myUserInfo = action.payload.user;
    },
    updateUser(state, action) {
      state.myUserInfo = action.payload.user;
    },
    fetchFriends(state, action) {
      state.friend_ids = action.payload;
    },
    setSelectedIndexMention(state, action) {
      state.mention.selectedIndex = action.payload;
    },
    setMention(state, action) {
      state.mention = action.payload;
    },
    setMentionIds(state, action) {
      state.mention.mentionIds = action.payload;
    },
  },
});

// Reducer
export const { setSelectedIndexMention, setMention, setMentionIds } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

export function UpdateMember(payload) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateMember(payload));
  };
}

export function FetchAllMembers() {
  return async (dispatch, getState) => {
    if (!client) return;

    // const page = 1;
    // const page_size = 10000;
    // const result = await client.queryUsers(page_size, page);

    // if (result) {
    //   const { data } = result;
    //   dispatch(slice.actions.fetchAllMembers(data));
    // }

    const users = client.state.users ? Object.values(client.state.users) : [];
    dispatch(slice.actions.fetchAllMembers(users));
  };
}

export function FetchUserProfile() {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;
    const result = await client.queryUser(user_id);

    if (result) {
      dispatch(slice.actions.fetchUser({ user: result }));
    }
  };
}

export const UpdateUserProfile = formValues => {
  return async (dispatch, getState) => {
    if (!client) return;
    const { name, about_me, avatar } = formValues;
    dispatch(UpdateIsLoading({ isLoading: true }));

    try {
      const updateAvatar = avatar ? await client.uploadFile(avatar) : null;
      const updateInfo = name || about_me ? await client.updateProfile(name, about_me) : null;
      const [avatarResult, infoResult] = await Promise.all([updateAvatar, updateInfo]);

      let data = {};
      if (infoResult) {
        data = { ...infoResult };
      } else {
        const { about_me, avatar, wallet_address, name, project_id } = avatarResult;
        data = { about_me, avatar, id: wallet_address, name, project_id };
      }

      dispatch(slice.actions.updateUser({ user: data }));
      dispatch(slice.actions.updateMember(data));
      dispatch(showSnackbar({ severity: 'success', message: 'Update profile successfully!' }));
      dispatch(UpdateIsLoading({ isLoading: false }));
      dispatch(CloseDialogProfile());
    } catch (error) {
      dispatch(UpdateIsLoading({ isLoading: false }));
      handleError(dispatch, error);
    }
  };
};

export function FetchFriends() {
  return async (dispatch, getState) => {
    if (!client) return;

    await client
      .queryContacts()
      .then(response => {
        const userIds = response.contact_users.map(user => user.id) || [];
        dispatch(slice.actions.fetchFriends(userIds));
      })
      .catch(err => {
        // handleError(dispatch, err);
      });
  };
}
