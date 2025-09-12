import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Box,
  Stack,
  Typography,
  IconButton,
  useTheme,
  Tooltip,
  alpha,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { onForwardMessage } from '../../redux/slices/messages';
import ChannelAvatar from '../../components/ChannelAvatar';
import { ArrowLeft, MagnifyingGlass, X } from 'phosphor-react';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { AvatarShape, ChatType } from '../../constants/commons-const';
import { showSnackbar } from '../../redux/slices/app';
import { LoadingSpinner } from '../../components/animate';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ForwardMessageDialog = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { openDialog, message } = useSelector(state => state.messages.forwardMessage);
  const { activeChannels, currentChannel } = useSelector(state => state.channel);
  const { canSendMessage } = useSelector(state => state.channel.channelPermissions);

  const [filteredChannels, setFilteredChannels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwardStatus, setForwardStatus] = useState({}); // 'idle' | 'loading' | 'sent' | 'error'

  const sortActiveChannels = useMemo(() => {
    return [...activeChannels].sort((a, b) => a.data.name.localeCompare(b.data.name));
  }, [activeChannels]);

  useEffect(() => {
    if (sortActiveChannels.length) {
      setFilteredChannels(sortActiveChannels);
    }
  }, [sortActiveChannels]);

  const onCloseDialog = () => {
    dispatch(onForwardMessage({ openDialog: false, message: null }));
    setSearchQuery('');
    setFilteredChannels([]);
    setTopics([]);
    setForwardStatus({});
  };

  const onSearch = event => {
    const value = event.target.value;
    setSearchQuery(value);

    const arr = topics.length ? topics : sortActiveChannels;

    if (value) {
      const results = arr.filter(channel => channel.data.name.toLowerCase().includes(value.toLowerCase())) || [];
      setFilteredChannels(results);
    } else {
      setFilteredChannels(arr);
    }
  };

  const sendForwardMessage = async channel => {
    if (!canSendMessage) {
      dispatch(
        showSnackbar({ severity: 'error', message: 'You do not have permission to send message in this channel' }),
      );
      return;
    }

    // Đặt trạng thái loading cho button send
    setForwardStatus(prev => ({ ...prev, [channel.id]: 'loading' }));

    try {
      // const payload = { text: message.text, cid: channel.cid, forward_cid: message.cid };

      // if (message.attachments) {
      //   payload.attachments = message.attachments.filter(item => item.type !== 'linkPreview');
      // }
      const payload = {
        cid: channel.cid,
        forward_cid: message.cid,
      };

      if (
        message.sticker_url &&
        (!message.text || message.text === '') &&
        (!message.attachments || (Array.isArray(message.attachments) && message.attachments.length === 0))
      ) {
        payload.sticker_url = message.sticker_url;
        payload.text = message.text;
      } else {
        payload.text = message.text || '';
        if (message.attachments && message.attachments.length > 0) {
          payload.attachments = message.attachments.filter(item => item.type !== 'linkPreview');
        }
      }

      const result = await currentChannel?.forwardMessage(payload, { type: channel.type, channelID: channel.id });
      if (result) {
        // Gửi thành công
        setForwardStatus(prev => ({ ...prev, [channel.id]: 'sent' }));
        dispatch(showSnackbar({ severity: 'success', message: 'Message forwarded successfully' }));
        onCloseDialog();
      }
    } catch (error) {
      // Gửi thất bại
      setForwardStatus(prev => ({ ...prev, [channel.id]: 'error' }));
      dispatch(showSnackbar({ severity: 'error', message: 'Unable to forward the message. Please try again' }));
    }
  };

  const onSelectChannel = channel => {
    if (channel.type === ChatType.TEAM && channel.state.topics.length > 0) {
      const activeTopics = channel.state.topics.filter(topic => !topic.data?.is_closed_topic);
      setTopics(activeTopics);
      setFilteredChannels(activeTopics);
      setSearchQuery('');
    } else {
      sendForwardMessage(channel);
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
    >
      <DialogTitle sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Forward message{' '}
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* -------------------------------search input---------------------------- */}
        <Box sx={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {topics.length > 0 && (
            <IconButton
              onClick={() => {
                setTopics([]);
                setFilteredChannels(sortActiveChannels);
                setSearchQuery('');
              }}
            >
              <ArrowLeft size={20} color={theme.palette.text.primary} />
            </IconButton>
          )}

          <Search>
            <SearchIconWrapper>
              <MagnifyingGlass size={18} color={theme.palette.text.primary} />
            </SearchIconWrapper>
            <StyledInputBase
              autoFocus
              placeholder="Forward to..."
              inputProps={{ 'aria-label': 'search' }}
              onChange={onSearch}
              value={searchQuery}
            />
          </Search>
        </Box>

        {/* -------------------------------channel list---------------------------- */}
        <Box sx={{ height: '350px', overflowY: 'auto' }} className="customScrollbar">
          <Stack direction="row" flexWrap="wrap">
            {filteredChannels.length ? (
              filteredChannels.map(channel => {
                const channelId = channel.id;
                const status = forwardStatus[channelId] || 'idle';
                const isDisabled = status === 'sent';

                return (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      width: '25%',
                      padding: '5px',
                    }}
                    key={channelId}
                  >
                    <Tooltip title={channel.data.name} placement="top">
                      <Stack
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                          width: '100%',
                          padding: '5px',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'background-color 0.3s',
                          position: 'relative',
                          '&:hover': { backgroundColor: theme.palette.divider },
                        }}
                        onClick={() => onSelectChannel(channel)}
                      >
                        <ChannelAvatar channel={channel} width={60} height={60} shape={AvatarShape.Round} />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            // paddingLeft: '15px',
                            width: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'center',
                          }}
                        >
                          {channel.data.name}
                        </Typography>

                        {status === 'loading' && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: alpha(theme.palette.background.default, 0.5),
                              zIndex: 2,
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            <LoadingSpinner />
                          </Box>
                        )}
                      </Stack>
                    </Tooltip>
                  </Stack>
                );
              })
            ) : (
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontSize: '16px',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  width: '100%',
                  padding: '20px 0',
                }}
              >
                No chats found
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
