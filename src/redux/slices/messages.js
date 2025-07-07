import { createSlice } from '@reduxjs/toolkit';
import { MessageReadType } from '../../constants/commons-const';
// ----------------------------------------------------------------------

const initialState = {
  quotesMessage: null,
  deleteMessage: { openDialog: false, messageId: '' },
  editMessage: null, // { channelType: '', channelId: '', messageId: '', messageText: '' },
  messageIdError: '',
  searchMessageId: '',
  messageReadType: MessageReadType.Empty,
  forwardMessage: { openDialog: false, message: null },
  unPinMessage: { openDialog: false, messageId: '' },
  filesMessage: { openDialog: false, files: [], uploadType: '' },
  attachmentsMessage: [],
};

const slice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    onReplyMessage(state, action) {
      state.quotesMessage = action.payload;
    },
    onDeleteMessage(state, action) {
      state.deleteMessage = action.payload;
    },
    onEditMessage(state, action) {
      state.editMessage = action.payload;
    },
    setMessageIdError(state, action) {
      state.messageIdError = action.payload;
    },
    setSearchMessageId(state, action) {
      state.searchMessageId = action.payload;
    },
    setMessageReadType(state, action) {
      state.messageReadType = action.payload;
    },
    onForwardMessage(state, action) {
      state.forwardMessage = action.payload;
    },
    onUnPinMessage(state, action) {
      state.unPinMessage = action.payload;
    },
    onFilesMessage(state, action) {
      state.filesMessage = action.payload;
    },

    onSetAttachmentsMessage(state, action) {
      state.attachmentsMessage = action.payload;
    },
  },
});

// Reducer
export const {
  onReplyMessage,
  onDeleteMessage,
  onEditMessage,
  setMessageIdError,
  setSearchMessageId,
  setMessageReadType,
  onForwardMessage,
  onUnPinMessage,
  onFilesMessage,
  onSetAttachmentsMessage,
} = slice.actions;

export default slice.reducer;
