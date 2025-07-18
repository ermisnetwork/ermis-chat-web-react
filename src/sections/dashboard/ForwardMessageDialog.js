import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, Box, Stack, Typography, IconButton, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { onForwardMessage } from '../../redux/slices/messages';
import AvatarComponent from '../../components/AvatarComponent';
import ChannelAvatar from '../../components/ChannelAvatar';
import { MagnifyingGlass, X } from 'phosphor-react';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { AvatarShape, ChatType } from '../../constants/commons-const';
import { showSnackbar } from '../../redux/slices/app';
import { formatString } from '../../utils/commons';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [forwardStatus, setForwardStatus] = useState({}); // 'idle' | 'loading' | 'sent' | 'error'

  useEffect(() => {
    if (activeChannels.length) {
      const sortedChannels = [...activeChannels].sort((a, b) => a.data.name.localeCompare(b.data.name));
      setFilteredChannels(sortedChannels);
    }
  }, [activeChannels]);

  const onCloseDialog = () => {
    dispatch(onForwardMessage({ openDialog: false, message: null }));
    setSearchQuery('');
    setFilteredChannels([]);
    setForwardStatus({});
  };

  const onSearch = event => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value) {
      const results =
        activeChannels.filter(channel => channel.data.name.toLowerCase().includes(value.toLowerCase())) || [];
      setFilteredChannels(results);
    } else {
      setFilteredChannels(activeChannels);
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
      }
    } catch (error) {
      // Gửi thất bại
      setForwardStatus(prev => ({ ...prev, [channel.id]: 'error' }));
      dispatch(showSnackbar({ severity: 'error', message: 'Unable to forward the message. Please try again' }));
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
        <Box sx={{ marginBottom: '20px' }}>
          <Search>
            <SearchIconWrapper>
              <MagnifyingGlass color="#709CE6" />
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
          <Stack spacing={2}>
            {filteredChannels.length ? (
              filteredChannels.map(channel => {
                const isPublic = channel.type === ChatType.TEAM && channel.data.public;
                const channelId = channel.id;
                const status = forwardStatus[channelId] || 'idle';
                const isDisabled = status === 'sent';

                return (
                  <Stack direction="row" alignItems="center" justifyContent="space-between" key={channelId}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{ width: 'calc(100% - 60px)', paddingRight: '15px' }}
                    >
                      {isPublic ? (
                        <AvatarComponent
                          name={channel.data.name}
                          url={channel.data?.image || ''}
                          width={30}
                          height={30}
                          isPublic={isPublic}
                          shape={AvatarShape.Round}
                        />
                      ) : (
                        <ChannelAvatar channel={channel} width={30} height={30} shape={AvatarShape.Round} />
                      )}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          paddingLeft: '15px',
                          width: 'calc(100% - 30px)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {formatString(channel.data.name)}
                      </Typography>
                    </Stack>

                    <LoadingButton
                      variant="outlined"
                      size="small"
                      sx={{ width: '60px' }}
                      onClick={() => sendForwardMessage(channel)}
                      loading={status === 'loading'}
                      disabled={isDisabled}
                      color={status === 'error' ? 'error' : 'primary'}
                    >
                      {status === 'sent' && 'Sent'}
                      {status === 'error' && 'Resend'}
                      {['idle', 'loading'].includes(status) && 'Send'}
                    </LoadingButton>
                  </Stack>
                );
              })
            ) : (
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                No result
              </Typography>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
