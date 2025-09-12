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
        return 'You have left the channel';
      case ConfirmType.REMOVE_MEMBER:
        return 'Remove member successfully!';
      case ConfirmType.DELETE_CHANNEL:
        return 'Delete channel successfully!';
      case ConfirmType.REMOVE_MODER:
        return 'Remove moder successfully!';
      case ConfirmType.TRUNCATE:
        return 'Conversation history delete successfully!';
      case ConfirmType.BLOCK:
        return `Successfully blocked ${directChannelName}`;
      case ConfirmType.UNBLOCK:
        return `Successfully unblocked ${directChannelName}`;
      case ConfirmType.UNBANNED:
        return `Successfully unbanned ${userName}`;
      case ConfirmType.DELETE_TOPIC:
        return 'Delete topic successfully!';
      default:
        return '';
    }
  };

  const messageContent = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return 'Are you sure you want to leave this channel?';
      case ConfirmType.REMOVE_MEMBER:
        return 'Are you sure you want to remove this member?';
      case ConfirmType.DELETE_CHANNEL:
        return (
          <>
            Once the channel <strong>{channelName}</strong> is deleted, all content and chat history will be permanently
            lost. This action cannot be undone.
            <br />
            Are you sure you want to proceed
          </>
        );
      case ConfirmType.REMOVE_MODER:
        return 'Are you sure you want to remove this user as a moderator?';
      case ConfirmType.TRUNCATE:
        return (
          <>
            Whole conversation history will permanently delete. <br /> Are you sure you want to delete?
          </>
        );
      case ConfirmType.BLOCK:
        return (
          <>
            Are you sure you want to block <strong>{directChannelName}</strong>.
            <br />
            He/she will no longer be able to send you message
          </>
        );
      case ConfirmType.UNBLOCK:
        return (
          <>
            Are you sure you want to unblock <strong>{directChannelName}</strong>.
            <br />
            He/she will be able to send you message again
          </>
        );
      case ConfirmType.UNBANNED:
        return (
          <>
            Are you sure you want to unban <strong>{userName}</strong>.
            <br />
            He/she will be able to send you message again
          </>
        );
      case ConfirmType.DELETE_TOPIC:
        return (
          <>
            Once the topic <strong>{channelName}</strong> is deleted, all content and chat history will be permanently
            lost. This action cannot be undone.
            <br />
            Are you sure you want to proceed
          </>
        );
      default:
        return '';
    }
  };

  const titleDialog = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return 'Leave this channel';
      case ConfirmType.REMOVE_MEMBER:
        return 'Remove this member';
      case ConfirmType.DELETE_CHANNEL:
        return 'Are you sure you want to delete this channel?';
      case ConfirmType.REMOVE_MODER:
        return 'Remove this moderator';
      case ConfirmType.TRUNCATE:
        return 'Clear chat history';
      case ConfirmType.BLOCK:
        return 'Block this user';
      case ConfirmType.UNBLOCK:
        return 'Unblock this user';
      case ConfirmType.UNBANNED:
        return 'Unban this user';
      case ConfirmType.DELETE_TOPIC:
        return 'Are you sure you want to delete this topic?';
      default:
        return '';
    }
  };

  const textButtonConfirm = () => {
    switch (type) {
      case ConfirmType.LEAVE:
        return 'Leave';
      case ConfirmType.REMOVE_MEMBER:
        return 'Remove';
      case ConfirmType.DELETE_CHANNEL:
        return 'Delete';
      case ConfirmType.REMOVE_MODER:
        return 'Remove';
      case ConfirmType.TRUNCATE:
        return 'Clear';
      case ConfirmType.BLOCK:
        return 'Block';
      case ConfirmType.UNBLOCK:
        return 'Unblock';
      case ConfirmType.UNBANNED:
        return 'Unban';
      case ConfirmType.DELETE_TOPIC:
        return 'Delete';
      default:
        return 'Yes';
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
            message: 'Failed to delete the channel. Please try again',
          }),
        );
      } else if (type === ConfirmType.TRUNCATE) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Failed to delete the chat. Please try again',
          }),
        );
      } else if (type === ConfirmType.BLOCK) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Unable to block the user. Please try again',
          }),
        );
      } else if (type === ConfirmType.UNBLOCK) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Unable to unblock the user. Please try again',
          }),
        );
      } else if (type === ConfirmType.UNBANNED) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Unable to unban the user. Please try again',
          }),
        );
      } else if (type === ConfirmType.DELETE_TOPIC) {
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Failed to delete the topic. Please try again',
          }),
        );
      } else {
        handleError(dispatch, error);
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
        <Button onClick={onCloseDialog}>Cancel</Button>
        <LoadingButton loading={loadingButton} onClick={onSubmit}>
          {textButtonConfirm()}
        </LoadingButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ChannelConfirmDialog;
