import { createSlice } from '@reduxjs/toolkit';
import axiosWalletInstance from '../../utils/axiosWallet';
import { handleError } from '../../utils/commons';
import { CHAINS, CHAIN_ID, TabIndexSdk } from '../../constants/wallet-const';
import { LocalStorageKey } from '../../constants/localStorage-const';
import { setOpenDialogPlatform, signOut } from './auth';
import { setCurrentChannel } from './channel';
import { client } from '../../client';
import { UpdateIsLoading, showSnackbar } from './app';
import { API_KEY } from '../../config';

// ----------------------------------------------------------------------

const initialState = {
  chainCurrent: null,
  projectCurrent: null,
  chains: [],
  yourProjects: [],
  newProjects: [],
  tabIndexSdk: TabIndexSdk.YourProjects,
  challenge: null,
  tokenGateData: [],
};

const slice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    fetchChains(state, action) {
      state.chains = action.payload;
    },
    setChainCurrent(state, action) {
      state.chainCurrent = action.payload;
      state.yourProjects = action.payload.your_projects;
      state.newProjects = action.payload.new_projects;
    },
    setProjectCurrent(state, action) {
      state.projectCurrent = action.payload;
    },
    setTabIndexSdk(state, action) {
      state.tabIndexSdk = action.payload;
    },
    setChallenge(state, action) {
      state.challenge = action.payload;
    },
    setTokenGateData(state, action) {
      state.tokenGateData = action.payload;
    },
  },
});

// Reducer
// export const { setTabIndexSdk } = slice.actions;

export default slice.reducer;

export function convertNewChains(data) {
  const { chains, joined, not_joined } = data;

  const newChains = chains.map(chainId => {
    const objChain = CHAINS.find(chain => chain.id === chainId);
    const joinedChain = joined.find(item => item.chain_id === chainId);
    const notJoinedChain = not_joined.find(item => item.chain_id === chainId);

    return {
      chain_id: chainId,
      logo: objChain ? objChain.logo : '',
      name: objChain ? objChain.name : '',
      your_projects: joinedChain ? joinedChain.clients : [],
      new_projects: notJoinedChain ? notJoinedChain.clients : [],
    };
  });

  return newChains;
}

export function SetTabIndexSdk(index) {
  return (dispatch, getState) => {
    dispatch(slice.actions.setTabIndexSdk(index));
  };
}

export function FetchChains() {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);
    const chain_id = Number(localStorage.getItem(LocalStorageKey.ChainId));
    const isCustomApiUrl = JSON.parse(window.localStorage.getItem(LocalStorageKey.IsCustomApiUrl));

    if (isCustomApiUrl) {
      const projectErmis = {
        project_name: 'ERMIS_MVP',
        project_id: 'b44937e4-c0d4-4a73-847c-3730a923ce83',
        display: 'public',
        image: null,
        description: 'Ermis MVP',
      };

      dispatch(slice.actions.setProjectCurrent(projectErmis));
      return;
    }

    await axiosWalletInstance
      .get('/uss/v1/users/chains', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async function (response) {
        if (response.status === 200) {
          const newChains = convertNewChains(response.data);

          dispatch(slice.actions.fetchChains(newChains));
          const existsChain = newChains.find(item => item.chain_id === chain_id);

          let chainCurrent;

          if (existsChain) {
            chainCurrent = existsChain;
          } else {
            const ermisChain = newChains.find(item => item.chain_id === CHAIN_ID.Ermis);
            chainCurrent = ermisChain;
          }

          if (chainCurrent) {
            window.localStorage.setItem(LocalStorageKey.ChainId, chainCurrent.chain_id);

            if (chainCurrent.chain_id === CHAIN_ID.Ermis) {
              dispatch(slice.actions.setProjectCurrent(chainCurrent.your_projects[0].projects[0]));
            }

            dispatch(slice.actions.setChainCurrent(chainCurrent));
          }
        }
      })
      .catch(function (error) {
        handleError(dispatch, error);
      });
  };
}

export function SetChainCurrent(chain) {
  return (dispatch, getState) => {
    window.localStorage.setItem(LocalStorageKey.ChainId, chain.chain_id);
    dispatch(slice.actions.setChainCurrent(chain));
    dispatch(setOpenDialogPlatform(false));
    dispatch(setCurrentChannel(null));

    if (chain.chain_id === CHAIN_ID.Ermis) {
      dispatch(SetProjectCurrent(chain.your_projects[0].projects[0]));
    }
  };
}

export function SetProjectCurrent(project) {
  return (dispatch, getState) => {
    dispatch(slice.actions.setProjectCurrent(project));
    if (client && project) {
      client._updateProjectID(project.project_id);
    }
  };
}

export function JoinProject(project_id) {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);
    const chain_id = Number(localStorage.getItem(LocalStorageKey.ChainId));

    await axiosWalletInstance
      .post(
        '/uss/v1/users/join',
        { project_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(async function (response) {
        if (response.status === 200) {
          const newChains = convertNewChains(response.data);
          dispatch(slice.actions.fetchChains(newChains));

          const chainCurrent = newChains.find(item => item.chain_id === chain_id);

          if (chainCurrent) {
            dispatch(slice.actions.setChainCurrent(chainCurrent));

            let projectCurrent;
            chainCurrent.your_projects.forEach(item => {
              projectCurrent = item.projects.find(project => project.project_id === project_id);
            });

            if (projectCurrent) {
              dispatch(SetProjectCurrent(projectCurrent));
              dispatch(SetTabIndexSdk(TabIndexSdk.YourProjects));
            }
          }
        }
      })
      .catch(function (error) {
        handleError(dispatch, error);
      });
  };
}

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
        handleError(dispatch, error);
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
        handleError(dispatch, error);
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

export function DeleteAccount(signature) {
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
          dispatch(showSnackbar({ severity: 'success', message: 'Your account has been successfully deleted' }));
          dispatch(ClearData());
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error);
      });
  };
}

export function DeleteAccountNoAuth(signature, address) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    await axiosWalletInstance
      .post(`/uss/v1/users/delete-no-auth/${address}`, { signature, apikey: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          dispatch(UpdateIsLoading({ isLoading: false }));
          dispatch(slice.actions.setChallenge(null));
          dispatch(showSnackbar({ severity: 'success', message: 'Your account has been successfully deleted' }));
          window.localStorage.clear();
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error);
      });
  };
}

export function FetchProjectCurrent() {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);

    await axiosWalletInstance
      .get('/uss/v1/users/current_project', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async function (response) {
        if (response.status === 200) {
          const data = response.data;
          const projectCurrent = {
            description: data.description,
            display: data.display,
            image: data.image,
            project_id: data.id,
            project_name: data.name,
          };

          dispatch(SetProjectCurrent(projectCurrent));
        }
      })
      .catch(function (error) {
        handleError(dispatch, error);
      });
  };
}

export function FetchTokenGateByChannelId(channelId) {
  return async (dispatch, getState) => {
    const token = localStorage.getItem(LocalStorageKey.AccessToken);

    await axiosWalletInstance
      .get(`/uss/v1/token_gate/channel_conditions/${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async function (response) {
        if (response.status === 200) {
          dispatch(slice.actions.setTokenGateData(response.data));
        }
      })
      .catch(function (error) {
        handleError(dispatch, error);
      });
  };
}
