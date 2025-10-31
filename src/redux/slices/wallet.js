import { createSlice } from '@reduxjs/toolkit';
import axiosWalletInstance from '../../utils/axiosWallet';
import { handleError } from '../../utils/commons';
import { LocalStorageKey } from '../../constants/localStorage-const';
import { signOut } from './auth';
import { client } from '../../client';
import { UpdateIsLoading, showSnackbar } from './app';
import { API_KEY } from '../../config';

// ----------------------------------------------------------------------

const initialState = {
  challenge: null,
};

const slice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setChallenge(state, action) {
      state.challenge = action.payload;
    },
  },
});

// Reducer
export default slice.reducer;

export function GetChallengeNoAuth(address) {
  return async (dispatch, getState) => {
    await axiosWalletInstance
      .post('/uss/v1/users/challenge-no-auth', { address })
      .then(async function (response) {
        if (response.status === 200) {
          const challenge = JSON.parse(response.data.challenge);
          dispatch(slice.actions.setChallenge(challenge));
        }
      })
      .catch(function (error) {
        handleError(dispatch, error, t);
      });
  };
}

export function GetChallenge() {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);

    await axiosWalletInstance
      .get('/uss/v1/users/challenge', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async function (response) {
        if (response.status === 200) {
          const challenge = JSON.parse(response.data.challenge);
          dispatch(slice.actions.setChallenge(challenge));
        }
      })
      .catch(function (error) {
        handleError(dispatch, error, t);
      });
  };
}

export function ClearData() {
  return async (dispatch, getState) => {
    await client?.disconnectUser();
    window.localStorage.clear();
    dispatch(signOut());
  };
}

export function DeleteAccount(signature, t) {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);
    const { user_id } = getState().auth;

    dispatch(UpdateIsLoading({ isLoading: true }));
    await axiosWalletInstance
      .post(
        `/uss/v1/users/delete/${user_id}`,
        { signature },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(async function (response) {
        if (response.status === 200) {
          dispatch(UpdateIsLoading({ isLoading: false }));
          dispatch(slice.actions.setChallenge(null));
          dispatch(showSnackbar({ severity: 'success', message: t('wallet.delete_account') }));
          dispatch(ClearData());
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error, t);
      });
  };
}

export function DeleteAccountNoAuth(signature, address, t) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    await axiosWalletInstance
      .post(`/uss/v1/users/delete-no-auth/${address}`, { signature, apikey: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          dispatch(UpdateIsLoading({ isLoading: false }));
          dispatch(slice.actions.setChallenge(null));
          dispatch(showSnackbar({ severity: 'success', message: t('wallet.delete_account') }));
          window.localStorage.clear();
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error, t);
      });
  };
}
