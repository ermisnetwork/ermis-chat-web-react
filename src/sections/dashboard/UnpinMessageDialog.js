import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Slide, DialogContentText, DialogActions } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { onUnPinMessage } from '../../redux/slices/messages';
import { showSnackbar } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UnpinMessageDialog = () => {
  const { t } = useTranslation();
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
        dispatch(showSnackbar({ severity: 'success', message: t('unpinMessageDialog.snackbar_submit_success') }));
        onCloseDialog();
        setLoadingButton(false);
      }
    } catch (error) {
      onCloseDialog();
      setLoadingButton(false);
      dispatch(
        showSnackbar({
          severity: 'error',
          message: t('unpinMessageDialog.snackbar_submit_error'),
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
      <DialogTitle>{t('unpinMessageDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          {t('unpinMessageDialog.message_up')} <br /> {t('unpinMessageDialog.message_down')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>{t('unpinMessageDialog.cancel')}</Button>
        <LoadingButton onClick={onSubmit} loading={loadingButton} color="error">
          {t('unpinMessageDialog.unpin')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UnpinMessageDialog;
