import { createSlice } from '@reduxjs/toolkit';
import { CallStatus } from '../../constants/commons-const';

const initialState = {
  openCallDirectDialog: false,
  callDirectData: null,
  peer: null,
  callDirectStatus: '',
};

const slice = createSlice({
  name: 'callDirect',
  initialState,
  reducers: {
    startCallDirect(state, action) {
      state.openCallDirectDialog = true;
      // state.callDirectStatus = CallStatus.IDLE;
      state.callDirectData = action.payload.callDirectData;
    },
    receivingCallDirect(state, action) {
      state.openCallDirectDialog = true;
      // state.callDirectStatus = CallStatus.RINGING;
      state.callDirectData = action.payload.callDirectData;
    },
    acceptCallDirect(state, action) {
      // state.callDirectStatus = CallStatus.CONNECTED;
      state.peer = action.payload.peer;
    },
    disconnectCallDirect(state, action) {
      state.openCallDirectDialog = false;
      state.callDirectStatus = '';
      state.callDirectData = null;
      state.peer = null;
    },
    setPeer: (state, action) => {
      state.peer = action.payload;
    },
    setCallDirectStatus: (state, action) => {
      state.callDirectStatus = action.payload;
    },
  },
});

export const { setPeer, setCallDirectStatus } = slice.actions;

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const StartCallDirect = data => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.startCallDirect({
        // callDirectData: data.callDirectData,
        callDirectData: data,
      }),
    );
  };
};

export const ReceivingCallDirect = data => {
  return (dispatch, getState) => {
    dispatch(
      slice.actions.receivingCallDirect({
        callDirectData: data.callDirectData,
      }),
    );
  };
};

export const AcceptCallDirect = data => {
  return (dispatch, getState) => {
    dispatch(
      slice.actions.acceptCallDirect({
        peer: data.peer,
      }),
    );
  };
};

export const DisconnectCallDirect = () => {
  return (dispatch, getState) => {
    dispatch(slice.actions.disconnectCallDirect());
  };
};
