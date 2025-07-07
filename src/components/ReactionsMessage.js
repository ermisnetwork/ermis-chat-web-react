import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Tooltip, Button } from '@mui/material';
import { EMOJI_QUICK } from '../constants/commons-const';
import { handleError } from '../utils/commons';
import { useDispatch, useSelector } from 'react-redux';

export default function ReactionsMessage({ isMyMessage, message }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user_id } = useSelector(state => state.auth);
  const { currentChannel } = useSelector(state => state.channel);

  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const newArr = Object.keys(message.reaction_counts).map(type => {
      const reactors = message.latest_reactions
        .filter(reaction => reaction.type === type)
        .map(reaction => reaction.user);
      const objReaction = EMOJI_QUICK.find(item => item.type === type);
      const value = objReaction ? objReaction.value : '';
      const isMyReact = reactors.some(reactor => reactor.id === user_id);
      return { type, value, count: message.reaction_counts[type], reactors, isMyReact };
    });
    setReactions(newArr);
  }, [message]);

  const onDeleteReaction = async type => {
    const messageID = message.id;
    await currentChannel.deleteReaction(messageID, type);
  };

  const onSendReaction = async type => {
    const messageID = message.id;

    await currentChannel.sendReaction(messageID, type);
  };

  const onToggleReaction = async data => {
    try {
      if (data.isMyReact) {
        await onDeleteReaction(data.type);
      } else {
        await onSendReaction(data.type);
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{
        justifyContent: isMyMessage ? 'right' : 'left',
        marginTop: '-10px',
        position: 'relative',
      }}
    >
      {reactions.map((item, idx) => {
        const reactorsName = item.reactors.map(reactor => {
          return reactor.name || reactor.id;
        });

        return (
          <Tooltip
            key={idx}
            placement="top"
            title={reactorsName.map((name, idx) => {
              return (
                <span key={idx} style={{ display: 'block' }}>
                  {name}
                </span>
              );
            })}
          >
            <Button
              variant="contained"
              color="inherit"
              sx={{
                minWidth: 'auto',
                height: 'auto',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '16px',
                fontSize: '12px',
                padding: '2px 5px',
                fontWeight: 600,
                border: `1px solid ${item.isMyReact ? theme.palette.action.active : 'transparent'}`,
                boxShadow: theme.shadows[6],
              }}
              onClick={() => onToggleReaction(item)}
            >
              <span>{item.value}</span>
              <span style={{ marginLeft: 5 }}>{item.count}</span>
            </Button>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
