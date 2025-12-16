import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Box, 
    IconButton, 
    List, 
    ListItem, 
    ListItemButton, 
    ListItemIcon, 
    ListItemText, 
    Popover, 
    styled, 
    Tooltip,
    useTheme, 
} from '@mui/material';
import { showSnackbar } from '../../redux/slices/app';
import { onDeleteMessage, onEditMessage, onReplyMessage } from '../../redux/slices/conversation';
import { onUnPinMessage } from '../../redux/slices/channel';
import { SetCooldownTime } from '../../redux/slices/cooldown';
import { MessageType } from '../../constants/commons-const';
import { ThreeDotsIcon } from '../Icons';
import { checkPermissionDeleteMessage, downloadFile } from '../../utils/commons';
import { useTranslation } from 'react-i18next';
import { Copy, Download, PencilSimple, PushPin, PushPinSimpleSlash, Trash } from 'phosphor-react';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.neutral,
  width: '22px',
  height: '22px',
  padding: '0px',
  color: theme.palette.text.primary,
}));

const MoreOptions = ({ message, setIsOpen, orderMore, isMyMessage }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel, pinnedMessages } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { canEditMessage, canDeleteMessage, canPinMessage } = useSelector(state => state.channel.channelPermissions);

  const [anchorEl, setAnchorEl] = useState(null);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const membership = currentChannel.state?.membership;
  const channelType = currentChannel.type;
  const messageId = message.id;
  const messageText = message.text;
  const isDelete = checkPermissionDeleteMessage(message, channelType, membership?.user_id, membership?.channel_role);
  const isEdit = isMyMessage && message.text && [MessageType.Regular].includes(message.type);
  const isDownload = message.attachments;
  const isUnPin = pinnedMessages.some(msg => msg.id === messageId);

  const onCoppyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      dispatch(showSnackbar({ severity: 'success', message: t('conversation.copy_text') }));
      setAnchorEl(null);
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: t('conversation.copy_failed') }));
      setAnchorEl(null);
    }
  };

  const onDelete = () => {
    if (!canDeleteMessage) {
      dispatch(showSnackbar({ severity: 'error', message: t('conversation.snackbar_delete') }));
      return;
    }

    dispatch(
      onDeleteMessage({
        openDialog: true,
        messageId,
      }),
    );
    setAnchorEl(null);
  };

  const onEdit = () => {
    if (!canEditMessage) {
      dispatch(showSnackbar({ severity: 'error', message: t('conversation.snackbar_edit') }));
      return;
    }

    dispatch(onEditMessage(message));
    dispatch(onReplyMessage(null));
    dispatch(SetCooldownTime(null));
    setAnchorEl(null);
    setIsOpen(false);
  };

  const onDownloadAllFiles = async () => {
    for (const file of message.attachments) {
      const url = file.asset_url || file.image_url;
      const filename = file.title || 'downloaded_file';
      if (url) {
        await downloadFile(url, filename); // Tải từng file một
      }
    }

    setAnchorEl(null);
  };

  const onTogglePin = async () => {
    try {
      setAnchorEl(null);
      if (!canPinMessage) {
        dispatch(showSnackbar({ severity: 'error', message: t('conversation.snackbar_pin') }));
        return;
      }

      if (isUnPin) {
        dispatch(
          onUnPinMessage({
            openDialog: true,
            messageId,
          }),
        );
      } else {
        const response = await currentChat.pinMessage(messageId);

        if (response) {
          dispatch(showSnackbar({ severity: 'success', message: t('conversation.snackbar_pinned') }));
        }
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: t('conversation.snackbar_pin_failed'),
        }),
      );
    }
  };

  return (
    <>
      <Tooltip title={t('conversation.more')}>
        <StyledIconButton
          sx={{ order: orderMore }}
          onClick={event => {
            setAnchorEl(event.currentTarget);
            setIsOpen(true);
          }}
        >
          <ThreeDotsIcon size={14} />
        </StyledIconButton>
      </Tooltip>
      <Popover
        id={Boolean(anchorEl) ? 'more-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setIsOpen(false);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <List>
          {/* ----------------------pin------------------------ */}
          <ListItem disablePadding onClick={onTogglePin}>
            <ListItemButton>
              <ListItemIcon>{isUnPin ? <PushPinSimpleSlash size={18} /> : <PushPin size={18} />}</ListItemIcon>
              <ListItemText
                primary={isUnPin ? t('conversation.unpin') : t('conversation.pin')}
                primaryTypographyProps={{
                  fontSize: '14px',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* ----------------------download------------------------ */}
          {isDownload && (
            <ListItem disablePadding onClick={onDownloadAllFiles}>
              <ListItemButton>
                <ListItemIcon>
                  <Download size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={t('conversation.download')}
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------edit------------------------ */}
          {isEdit && (
            <ListItem disablePadding onClick={onEdit}>
              <ListItemButton>
                <ListItemIcon>
                  <PencilSimple size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={t('conversation.edit')}
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------coppy text------------------------ */}
          {messageText && (
            <ListItem disablePadding>
              <ListItemButton onClick={onCoppyText}>
                <ListItemIcon>
                  <Copy size={18} />
                </ListItemIcon>
                <ListItemText
                  primary={t('conversation.copy')}
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------delete------------------------ */}
          {isDelete && (
            <ListItem disablePadding>
              <ListItemButton onClick={onDelete}>
                <ListItemIcon>
                  <Trash size={18} color={theme.palette.error.main} />
                </ListItemIcon>
                <ListItemText
                  primary={t('conversation.delete')}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    color: theme.palette.error.main,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

export default MoreOptions;