import { t } from 'i18next';
import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Stack, 
    Radio, 
    LinearProgress,
    useTheme, 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../../redux/slices/app';
import { setPollResult } from '../../redux/slices/dialog';
import { getMemberInfo } from '../../utils/commons';
import CustomCheckbox from '../../components/CustomCheckbox';
import { useTranslation } from 'react-i18next';

const PollBox = ({ message, all_members }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const currentChat = currentTopic ? currentTopic : currentChannel;
  const { user_id } = useSelector(state => state.auth);
  const pollType = message.poll_type; // 'single' hoặc 'multiple'
  const pollOptions = message.poll_choice_counts || {}; // {option: count, ...}
  const [selected, setSelected] = useState(pollType === 'multiple' ? [] : '');

  const hasVoted = Array.isArray(message.latest_poll_choices)
    ? message.latest_poll_choices.some(choice => choice.user_id === user_id)
    : false;

  const totalMembers = currentChannel?.state?.members ? Object.keys(currentChannel.state.members).length : 0;
  const totalVotes = Array.isArray(message.latest_poll_choices) ? message.latest_poll_choices.length : 0;

  const handleChange = option => {
    if (pollType === 'multiple') {
      setSelected(prev => (prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option]));
    } else {
      setSelected(option);
    }
  };

  const handleVote = async () => {
    if (!selected || (selected.length === 0 && pollType === 'multiple')) {
      dispatch(showSnackbar({ severity: 'error', message: t('conversation.snackbar_vote') }));
      return;
    }

    if (pollType === 'multiple' && Array.isArray(selected)) {
      for (const choice of selected) {
        await currentChat.votePoll(message.id, choice);
      }
    } else {
      await currentChat.votePoll(message.id, selected);
    }
  };

  const handleShowPollResult = () => {
    const pollResult = Object.keys(message.poll_choice_counts).map(option => {
      const users = message.latest_poll_choices
        .filter(choice => choice.text === option)
        .map(choice => {
          const memberInfo = getMemberInfo(choice.user_id, all_members);
          return {
            id: choice.user_id,
            name: memberInfo ? memberInfo.name : choice.user_id,
            avatar: memberInfo ? memberInfo.avatar : '',
          };
        });
      return { text: option, users };
    });

    dispatch(
      setPollResult({
        openDialog: true,
        question: message.text,
        results: pollResult,
      }),
    );
  };

  const colorMsg = message.isMyMessage ? '#fff' : theme.palette.text.primary;
  const senderName = message.user.name;

  return (
    <Box sx={{ maxWidth: '100%', width: '20rem', padding: '8px' }}>
      <Typography
        variant="body1"
        color={message.isMyMessage ? '#fff' : theme.palette.primary.main}
        sx={{ fontWeight: 600, marginBottom: 2, fontSize: '12px' }}
      >
        {senderName}
      </Typography>

      <Typography
        variant="subtitle1"
        color={colorMsg}
        sx={{ fontWeight: 600, marginBottom: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '18px' }}
      >
        {message.text}
      </Typography>
      <Stack spacing={1}>
        {Object.entries(pollOptions).map(([option, count]) => {
          const percent = totalMembers === 0 ? 0 : Math.round((count / totalMembers) * 100);
          return (
            <Stack key={option} direction={'row'} alignItems="center" justifyContent="space-between" spacing={2}>
              {!hasVoted && (
                <>
                  {pollType === 'multiple' ? (
                    <CustomCheckbox
                      name={option}
                      checked={selected.includes(option)}
                      onChange={() => handleChange(option)}
                      sx={{
                        p: 0,
                        color: colorMsg,
                        '&.Mui-checked': {
                          color: colorMsg,
                        },
                      }}
                    />
                  ) : (
                    <Radio
                      name="poll-radio"
                      checked={selected === option}
                      onChange={() => handleChange(option)}
                      sx={{
                        p: 0,
                        color: colorMsg,
                        '&.Mui-checked': {
                          color: colorMsg,
                        },
                      }}
                    />
                  )}
                </>
              )}

              {hasVoted && count > 0 && (
                <Typography
                  variant="caption"
                  color={message.isMyMessage ? '#fff' : theme.palette.primary.main}
                  sx={{ fontSize: '16px', fontWeight: 600, marginTop: '-10px!important' }}
                >
                  {percent}%
                </Typography>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color={colorMsg} sx={{ flex: 1, fontSize: '16px', fontWeight: 400 }}>
                  {option}
                </Typography>

                {hasVoted && (
                  <LinearProgress
                    variant="determinate"
                    value={totalMembers === 0 ? 0 : (count / totalMembers) * 100}
                    sx={{
                      mt: 1,
                      height: 3,
                      borderRadius: 4,
                      background: message.isMyMessage ? theme.palette.primary.main : theme.palette.grey[100],
                      '& .MuiLinearProgress-bar': {
                        background: message.isMyMessage ? '#fff' : theme.palette.primary.main,
                      },
                    }}
                  />
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>

      {!hasVoted && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleVote}
            variant="contained"
            sx={{
              minWidth: '100px',
              backgroundColor: message.isMyMessage ? '#fff' : theme.palette.primary.main,
              color: message.isMyMessage ? theme.palette.primary.main : '#fff',
            }}
          >
            {t('conversation.vote')}
          </Button>
        </Box>
      )}

      {hasVoted && message.isMyMessage && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            sx={{
              minWidth: '100px',
              backgroundColor: message.isMyMessage ? '#fff' : theme.palette.primary.main,
              color: message.isMyMessage ? theme.palette.primary.main : '#fff',
            }}
            onClick={handleShowPollResult}
          >
            {t('conversation.result')}
          </Button>
        </Box>
      )}

      <Typography
        variant="body2"
        color={message.isMyMessage ? theme.palette.grey[400] : theme.palette.text.secondary}
        sx={{ fontSize: '12px', position: 'absolute', bottom: '13px' }}
      >
        {totalVotes} {t('conversation.votes')}
      </Typography>
    </Box>
  );
};
export default PollBox;