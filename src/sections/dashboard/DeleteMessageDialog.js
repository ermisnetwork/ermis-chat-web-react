import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Slide, DialogContentText, DialogActions } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { onDeleteMessage, setMessageIdError } from '../../redux/slices/messages';
import { handleError } from '../../utils/commons';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DeleteMessageDialog = () => {
  const dispatch = useDispatch();
  const { openDialog, messageId } = useSelector(state => state.messages.deleteMessage);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);

  const [loadingButton, setLoadingButton] = useState(false);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const onCloseDialog = () => {
    dispatch(onDeleteMessage({ openDialog: false, messageId: '' }));
  };

  const onSubmit = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChat.deleteMessage(messageId);
      if (response) {
        onCloseDialog();
        setLoadingButton(false);
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        dispatch(setMessageIdError(messageId));
      } else {
        handleError(dispatch, error);
      }
      onCloseDialog();
      setLoadingButton(false);
    }
  };

  return (
    <Dialog
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>Delete message</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want delete this message?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>Cancel</Button>
        <LoadingButton onClick={onSubmit} loading={loadingButton}>
          Yes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMessageDialog;
