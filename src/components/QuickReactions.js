import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Button, Popover, IconButton } from '@mui/material';
import { EMOJI_QUICK } from '../constants/commons-const';
import { handleError } from '../utils/commons';
import { useDispatch, useSelector } from 'react-redux';
import { LikeIcon } from './Icons';

export default function QuickReactions({ message }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { canReactMessage } = useSelector(state => state.channel.channelPermissions);

  const [anchorEl, setAnchorEl] = useState(null);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const onReactMessage = async type => {
    try {
      const messageID = message.id;

      const response = await currentChat.sendReaction(messageID, type);
      if (response) {
        setAnchorEl(null);
      }
    } catch (error) {
      setAnchorEl(null);
      handleError(dispatch, error);
    }
  };

  const my_reactions = message.latest_reactions
    ? message.latest_reactions.filter(item => item.user_id === user_id).map(item => item.type)
    : [];

  return (
    <>
      <Button
        variant="contained"
        color="inherit"
        sx={{
          minWidth: 'auto',
          height: 'auto',
          backgroundColor: theme.palette.background.paper,
          borderRadius: '16px',
          padding: '2px 8px',
          boxShadow: theme.shadows[6],
        }}
        onClick={event => {
          if (!canReactMessage) {
            dispatch(
              showSnackbar({
                severity: 'error',
                message: 'You do not have permission to react message in this channel',
              }),
            );
            return;
          }

          setAnchorEl(event.currentTarget);
        }}
      >
        <LikeIcon color={theme.palette.text.icon} />
      </Button>
      <Popover
        id={Boolean(anchorEl) ? 'reaction-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '30px',
          },
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ padding: '5px' }}>
          {EMOJI_QUICK.map(item => {
            return (
              <IconButton
                key={item.type}
                sx={{ fontSize: 14, width: 35, height: 35 }}
                onClick={() => onReactMessage(item.type)}
                disabled={my_reactions.includes(item.type)}
              >
                {item.value}
              </IconButton>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}
