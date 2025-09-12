import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Slide, DialogContentText, DialogActions } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { onUnPinMessage } from '../../redux/slices/messages';
import { showSnackbar } from '../../redux/slices/app';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UnpinMessageDialog = () => {
  const dispatch = useDispatch();
  const { openDialog, messageId } = useSelector(state => state.messages.unPinMessage);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const [loadingButton, setLoadingButton] = useState(false);

  const onCloseDialog = () => {
    dispatch(onUnPinMessage({ openDialog: false, messageId: '' }));
  };

  const onSubmit = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChat.unpinMessage(messageId);
      if (response) {
        dispatch(showSnackbar({ severity: 'success', message: 'Message unpinned' }));
        onCloseDialog();
        setLoadingButton(false);
      }
    } catch (error) {
      onCloseDialog();
      setLoadingButton(false);
      dispatch(
        showSnackbar({
          severity: 'error',
          message: 'Unable to unpin the message. Please try again',
        }),
      );
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>Unpin this message?</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want to unpin this message? <br /> It will no longer appear at the top of the conversation.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>Cancel</Button>
        <LoadingButton onClick={onSubmit} loading={loadingButton} color="error">
          Unpin
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UnpinMessageDialog;
