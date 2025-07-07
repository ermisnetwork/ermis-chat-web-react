import { createSlice } from '@reduxjs/toolkit';

import { SetUserLogin, UpdateIsLoading, setIsResetEmailSent, showSnackbar } from './app';
import { client } from '../../client';
import axiosWalletInstance from '../../utils/axiosWallet';
import { handleError } from '../../utils/commons';
import { API_KEY } from '../../config';
import { LocalStorageKey } from '../../constants/localStorage-const';
import { LoginType } from '../../constants/commons-const';
import uuidv4 from '../../utils/uuidv4';

// ----------------------------------------------------------------------

const initialState = {
  isLoggedIn: false,
  user_id: null,
  project_id_ermis: null,
  openDialogPlatform: true,
  loginType: '',
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logIn(state, action) {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.user_id = action.payload.user_id;
      state.project_id_ermis = action.payload.project_id_ermis;
      state.openDialogPlatform = action.payload.openDialogPlatform;
      state.loginType = action.payload.loginType;
    },
    signOut(state, action) {
      state.isLoggedIn = false;
      state.user_id = null;
      state.project_id_ermis = null;
      state.openDialogPlatform = true;
      state.loginType = '';
    },
    setOpenDialogPlatform(state, action) {
      state.openDialogPlatform = action.payload;
    },
    setLoginType(state, action) {
      state.loginType = action.payload;
    },
  },
});

// Reducer
export const { setOpenDialogPlatform, signOut, logIn } = slice.actions;
export default slice.reducer;

export function LoginUserByWallet(data) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    const { address, signature, nonce } = data;

    await axiosWalletInstance
      .post('/uss/v1/wallets/auth', { address, signature, nonce, api_key: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          const { refresh_token, token, user_id, project_id } = response.data;
          dispatch(
            slice.actions.logIn({
              isLoggedIn: true,
              user_id: user_id,
              project_id_ermis: project_id,
              openDialogPlatform: false,
              loginType: LoginType.Wallet,
            }),
          );
          window.localStorage.setItem(LocalStorageKey.UserId, user_id);
          window.localStorage.setItem(LocalStorageKey.AccessToken, token);
          window.localStorage.setItem(LocalStorageKey.RefreshToken, refresh_token);
          window.localStorage.setItem(LocalStorageKey.SessionId, uuidv4());
          dispatch(UpdateIsLoading({ isLoading: false }));
          window.location.reload();

          // const userInfo = await FetchUserFirst(user_id, token);
          // if (userInfo.name === user_id) {
          //   // show dialog update user
          //   setTimeout(() => {
          //     dispatch(OpenDialogProfile());
          //   }, 500);
          // }
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error);
      });
  };
}

export function LogoutUser() {
  return async (dispatch, getState) => {
    await client.disconnectUser();

    window.localStorage.removeItem(LocalStorageKey.UserId);
    window.localStorage.removeItem(LocalStorageKey.AccessToken);
    window.localStorage.removeItem(LocalStorageKey.RefreshToken);
    window.localStorage.removeItem(LocalStorageKey.SessionId);
    window.localStorage.removeItem(LocalStorageKey.AppVersion);
    window.localStorage.removeItem(LocalStorageKey.ChainId);
    window.localStorage.removeItem(LocalStorageKey.ApiUrl);
    window.localStorage.removeItem(LocalStorageKey.IsCustomApiUrl);

    dispatch(slice.actions.signOut());
  };
}

export function RegisterUserByEmail(formValues, navigate) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    await axiosWalletInstance
      .post('/uss/v1/wallets/register', {
        ...formValues,
        apikey: API_KEY,
      })
      .then(function (response) {
        dispatch(
          SetUserLogin({
            ...formValues,
            message: 'Registration successful! Please login to start using the chat application!',
          }),
        );
        navigate('/login');
        dispatch(UpdateIsLoading({ isLoading: false }));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: error.description,
          }),
        );
      });
  };
}

export function LoginUserByEmail(data) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    const { email, password } = data;

    await axiosWalletInstance
      .post('/uss/v1/wallets/email_login', { email, password, apikey: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          const { refresh_token, token, user_id, project_id } = response.data;
          dispatch(
            slice.actions.logIn({
              isLoggedIn: true,
              user_id: user_id,
              project_id_ermis: project_id,
              openDialogPlatform: false,
              loginType: LoginType.Email,
            }),
          );
          window.localStorage.setItem(LocalStorageKey.UserId, user_id);
          window.localStorage.setItem(LocalStorageKey.AccessToken, token);
          window.localStorage.setItem(LocalStorageKey.RefreshToken, refresh_token);
          window.localStorage.setItem(LocalStorageKey.SessionId, uuidv4());
          dispatch(UpdateIsLoading({ isLoading: false }));
          window.location.reload();
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: error.description,
          }),
        );
      });
  };
}

export function ForgotPasswordByEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));

    await axiosWalletInstance
      .post('/uss/v1/wallets/forgot', {
        ...formValues,
        apikey: API_KEY,
      })
      .then(function (response) {
        dispatch(
          showSnackbar({
            severity: 'success',
            message: 'Your password reset request has been successfully sent. Please check your email to proceed!',
          }),
        );
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(setIsResetEmailSent(true));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: error.description,
          }),
        );
        dispatch(setIsResetEmailSent(false));
      });
  };
}

export function ResetPasswordByEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));

    await axiosWalletInstance
      .post('/uss/v1/wallets/reset', {
        ...formValues,
      })
      .then(function (response) {
        dispatch(
          showSnackbar({
            severity: 'success',
            message: 'Your password has been successfully reset. Please use the new password to log in!',
          }),
        );
        dispatch(UpdateIsLoading({ isLoading: false }));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: error.description,
          }),
        );
      });
  };
}
