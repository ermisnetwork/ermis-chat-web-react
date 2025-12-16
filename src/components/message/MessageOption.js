import {
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Button,
  LinearProgress,
  styled,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { MessageType } from '../../constants/commons-const';
import {
  onDeleteMessage,
  onEditMessage,
  onForwardMessage,
  onReplyMessage,
  onUnPinMessage,
} from '../../redux/slices/messages';
import { ForwardIcon, QuoteDownIcon, ThreeDotsIcon } from '../Icons';
import { checkPermissionDeleteMessage, downloadFile } from '../../utils/commons';
import { SetCooldownTime } from '../../redux/slices/channel';
import { 
  Copy, 
  PushPin, 
  PushPinSimpleSlash, 
  Trash, 
  Download, 
  PencilSimple
} from 'phosphor-react';

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

const MessageOption = ({ isMyMessage, message }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isGuest } = useSelector(state => state.channel);

  const [isOpen, setIsOpen] = useState(false);
  const isForward = [MessageType.Regular, MessageType.Sticker].includes(message.type);
  const orderReply = isMyMessage ? 3 : 1;
  const orderForward = 2;
  const orderMore = isMyMessage ? 1 : 3;

  const onReply = () => {
    dispatch(onReplyMessage(message));
    dispatch(onEditMessage(null));
  };

  const onForward = () => {
    dispatch(
      onForwardMessage({
        openDialog: true,
        message,
      }),
    );
  };

  if (isGuest) return null;

  return (
    <Box className={`messageActions ${isOpen ? 'open' : ''}`} sx={{ visibility: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          position: 'absolute',
          top: '50%',
          left: isMyMessage ? 'auto' : '100%',
          right: isMyMessage ? '100%' : 'auto',
          transform: 'translateY(-50%)',
          padding: '8px',
        }}
      >
        <Tooltip title={t('conversation.reply')}>
          <StyledIconButton sx={{ order: orderReply }} onClick={onReply}>
            <QuoteDownIcon size={14} />
          </StyledIconButton>
        </Tooltip>
        {isForward && (
          <Tooltip title={t('conversation.forward')}>
            <StyledIconButton sx={{ order: orderForward }} onClick={onForward}>
              <ForwardIcon size={14} />
            </StyledIconButton>
          </Tooltip>
        )}

        <MoreOptions message={message} setIsOpen={setIsOpen} orderMore={orderMore} isMyMessage={isMyMessage} />
      </Stack>
    </Box>
  );
};

export default MessageOption;
