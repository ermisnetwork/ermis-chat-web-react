import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  DialogContentText,
  DialogActions,
  styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { setSidebar, showSnackbar } from '../../redux/slices/app';
import { getChannelName, handleError } from '../../utils/commons';
import { setChannelConfirm } from '../../redux/slices/dialog';
import { RemoveActiveChannel } from '../../redux/slices/channel';
import { ConfirmType, SidebarType } from '../../constants/commons-const';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import { ClientEvents } from '../../constants/events-const';
import { client } from '../../client';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogActions-root': {
    paddingBottom: 0,
  },
  '& .MuiDialogTitle-root': {
    paddingBottom: '16px',
  },
}));

const ChannelConfirmDialog = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { openDialog, channel, userId, type } = useSelector(state => state.dialog.channelConfirm);
  const users = client.state.users ? Object.values(client.state.users) : [];
  const userName = users.find(user => user.id === userId)?.name || 'User';

  const channelId = channel.data.id;
  const channelName = channel.data.name;
  const directChannelName = getChannelName(channel, users);

  const [loadingButton, setLoadingButton] = useState(false);

  useEffect(() => {
    if (channel) {
      const handleChannelConfirmed = () => {
        dispatch(
          showSnackbar({
            severity: 'success',
            message: messageSnackbar(),
          }),
        );

        onCloseDialog();
        setLoadingButton(false);

        // if ([ConfirmType.LEAVE, ConfirmType.DELETE_CHANNEL].includes(type)) {
        //   dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
        //   dispatch(RemoveActiveChannel(channelId));
        //   navigate(`${DEFAULT_PATH}`);
        // }
      };

      channel.on(ClientEvents.ChannelDeleted, handleChannelConfirmed);
      channel.on(ClientEvents.MemberRemoved, handleChannelConfirmed);
      channel.on(ClientEvents.MemberDemoted, handleChannelConfirmed);
      channel.on(ClientEvents.ChannelTruncate, handleChannelConfirmed);
      channel.on(ClientEvents.MemberBlocked, handleChannelConfirmed);
      channel.on(ClientEvents.MemberUnblocked, handleChannelConfirmed);
      channel.on(ClientEvents.MemberUnBanned, handleChannelConfirmed);

      return () => {
        channel.off(ClientEvents.ChannelDeleted, handleChannelConfirmed);
        channel.off(ClientEvents.MemberRemoved, handleChannelConfirmed);
        channel.off(ClientEvents.MemberDemoted, handleChannelConfirmed);
        channel.off(ClientEvents.ChannelTruncate, handleChannelConfirmed);
        channel.off(ClientEvents.MemberBlocked, handleChannelConfirmed);
        channel.off(ClientEvents.MemberUnblocked, handleChannelConfirmed);
        channel.off(ClientEvents.MemberUnBanned, handleChannelConfirmed);
      };
    }
  }, [channel, type]);

  const onCloseDialog = () => {
    dispatch(setChannelConfirm(null));
  };

  const messageSnackbar = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return t('channelConfirmDialog.snackbar_leave');
      case ConfirmType.REMOVE_MEMBER:
        return t('channelConfirmDialog.snackbar_remove_member');
      case ConfirmType.DELETE_CHANNEL:
        return t('channelConfirmDialog.snackbar_delete_channel');
      case ConfirmType.REMOVE_MODER:
        return t('channelConfirmDialog.snackbar_delete_moder');
      case ConfirmType.TRUNCATE:
        return t('channelConfirmDialog.snackbar_delete_history');
      case ConfirmType.BLOCK:
        return `${t('channelConfirmDialog.snackbar_blocked')} ${directChannelName}`;
      case ConfirmType.UNBLOCK:
        return `${t('channelConfirmDialog.snackbar_unblocked')} ${directChannelName}`;
      case ConfirmType.UNBANNED:
        return `${t('channelConfirmDialog.snackbar_unbanned')} ${userName}`;
      case ConfirmType.DELETE_TOPIC:
        return t('channelConfirmDialog.snackbar_delete_topic');
      default:
        return '';
    }
  };

  const messageContent = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return t('channelConfirmDialog.snackbar_confirm_leave_channel');
      case ConfirmType.REMOVE_MEMBER:
        return t('channelConfirmDialog.snackbar_confirm_remove_member');
      case ConfirmType.DELETE_CHANNEL:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_delete_one')} <strong>{channelName}</strong> {t('channelConfirmDialog.snackbar_confirm_delete_two')}
            <br />
            {t('channelConfirmDialog.snackbar_confirm_delete_three')}
          </>
        );
      case ConfirmType.REMOVE_MODER:
        return t('channelConfirmDialog.snackbar_confirm_remove_moder');
      case ConfirmType.TRUNCATE:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_delete_conversation')} <br /> {t('channelConfirmDialog.snackbar_confirm_delete')}
          </>
        );
      case ConfirmType.BLOCK:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_block')} <strong>{directChannelName}</strong>.
            <br />
            {t('channelConfirmDialog.snackbar_confirm_block_message')}
          </>
        );
      case ConfirmType.UNBLOCK:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_unblock')} <strong>{directChannelName}</strong>.
            <br />
            {t('channelConfirmDialog.snackbar_confirm_unblock_message')}
          </>
        );
      case ConfirmType.UNBANNED:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_unban')} <strong>{userName}</strong>.
            <br />
            {t('channelConfirmDialog.snackbar_confirm_unban_message')}
          </>
        );
      case ConfirmType.DELETE_TOPIC:
        return (
          <>
            {t('channelConfirmDialog.snackbar_confirm_delete_topic_one')} <strong>{channelName}</strong> {t('channelConfirmDialog.snackbar_confirm_delete_topic_two')}
            <br />
            {t('channelConfirmDialog.snackbar_confirm_proceed')}
          </>
        );
      default:
        return '';
    }
  };

  const titleDialog = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return t('channelConfirmDialog.dialog_title_leave_channel');
      case ConfirmType.REMOVE_MEMBER:
        return t('channelConfirmDialog.dialog_title_remove_member_action');
      case ConfirmType.DELETE_CHANNEL:
        return t('channelConfirmDialog.dialog_title_delete_channel');
      case ConfirmType.REMOVE_MODER:
        return t('channelConfirmDialog.dialog_title_remove_moderator');
      case ConfirmType.TRUNCATE:
        return t('channelConfirmDialog.dialog_title_clear_history');
      case ConfirmType.BLOCK:
        return t('channelConfirmDialog.dialog_title_block_user');
      case ConfirmType.UNBLOCK:
        return t('channelConfirmDialog.dialog_title_unblock_user');
      case ConfirmType.UNBANNED:
        return t('channelConfirmDialog.dialog_title_unban_user');
      case ConfirmType.DELETE_TOPIC:
        return t('channelConfirmDialog.dialog_title_delete_topic');
      default:
        return '';
    }
  };

  const textButtonConfirm = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return t('channelConfirmDialog.leave');
      case ConfirmType.REMOVE_MEMBER:
        return t('channelConfirmDialog.remove');
      case ConfirmType.DELETE_CHANNEL:
        return t('channelConfirmDialog.delete');
      case ConfirmType.REMOVE_MODER:
        return t('channelConfirmDialog.remove');
      case ConfirmType.TRUNCATE:
        return t('channelConfirmDialog.clear');
      case ConfirmType.BLOCK:
        return t('channelConfirmDialog.block');
      case ConfirmType.UNBLOCK:
        return t('channelConfirmDialog.unblock');
      case ConfirmType.UNBANNED:
        return t('channelConfirmDialog.unban');
      case ConfirmType.DELETE_TOPIC:
        return t('channelConfirmDialog.delete');
      default:
        return t('channelConfirmDialog.yes');
    }
  };

  const onSubmit = async () => {
    try {
      setLoadingButton(true);
      const response = [ConfirmType.LEAVE, ConfirmType.REMOVE_MEMBER].includes(type)
        ? await channel.removeMembers([userId])
        : [ConfirmType.DELETE_CHANNEL, ConfirmType.DELETE_TOPIC].includes(type)
          ? await channel.delete()
          : type === ConfirmType.REMOVE_MODER
            ? await channel.demoteModerators([userId])
            : type === ConfirmType.TRUNCATE
              ? await channel.truncate()
              : type === ConfirmType.BLOCK
                ? await channel.blockUser()
                : type === ConfirmType.UNBLOCK
                  ? await channel.unblockUser()
                  : type === ConfirmType.UNBANNED
                    ? await channel.unbanMembers([userId])
                    : null;
    } catch (error) {
      onCloseDialog();
      setLoadingButton(false);

      if (type === ConfirmType.DELETE_CHANNEL) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_delete_channel'),
          }),
        );
      } else if (type === ConfirmType.TRUNCATE) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_delete_chat'),
          }),
        );
      } else if (type === ConfirmType.BLOCK) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_block_user'),
          }),
        );
      } else if (type === ConfirmType.UNBLOCK) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_unblock_user'),
          }),
        );
      } else if (type === ConfirmType.UNBANNED) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_unban_user'),
          }),
        );
      } else if (type === ConfirmType.DELETE_TOPIC) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: t('channelConfirmDialog.snackbar_error_delete_topic'),
          }),
        );
      } else {
        handleError(dispatch, error, t);
      }
    }
  };

  return (
    <StyledDialog
      fullWidth
      maxWidth="xs"
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>{titleDialog()}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">{messageContent()}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>{t('channelConfirmDialog.cancel')}</Button>
        <LoadingButton loading={loadingButton} onClick={onSubmit}>
          {textButtonConfirm()}
        </LoadingButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ChannelConfirmDialog;
