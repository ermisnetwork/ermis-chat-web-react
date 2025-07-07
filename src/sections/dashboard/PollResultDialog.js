import React from 'react';
import { useTheme } from '@emotion/react';
import { Stack, Dialog, DialogContent, DialogTitle, IconButton, Slide, Typography, Box, Divider } from '@mui/material';
import { X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { setPollResult } from '../../redux/slices/dialog';
import MemberAvatar from '../../components/MemberAvatar';
import { formatString } from '../../utils/commons';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PollResultDialog() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { pollResult } = useSelector(state => state.dialog);
  const { openDialog, question, results } = pollResult;

  const onCloseDialog = () => {
    dispatch(setPollResult({ openDialog: false, question: '', results: [] }));
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={openDialog} TransitionComponent={Transition} onClose={onCloseDialog}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Poll Result
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
          <strong>{question}</strong>
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ maxHeight: '400px', overflowY: 'auto' }} className="customScrollbar">
          <Stack spacing={2}>
            {results.map((item, index) => {
              const totalMembers = Object.values(currentChannel.state.members)?.length || 1;
              const percent = Math.round((item.users.length / totalMembers) * 100);
              return (
                <Stack key={index} spacing={1}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent={'space-between'}
                    spacing={1}
                    sx={{
                      backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.default,
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      {item.text}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {percent}%
                    </Typography>
                  </Stack>
                  <Stack>
                    {item.users.length ? (
                      item.users.map((user, idx) => (
                        <Stack
                          key={idx}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{
                            padding: '5px',
                          }}
                        >
                          <MemberAvatar
                            member={{ name: user.name, avatar: user.avatar, id: user.id }}
                            width={24}
                            height={24}
                          />
                          <Typography variant="body2">{formatString(user.name)}</Typography>
                        </Stack>
                      ))
                    ) : (
                      <Typography
                        sx={{
                          textAlign: 'center',
                          fontStyle: 'italic',
                          fontSize: '12px',
                          color: theme.palette.text.secondary,
                          fontWeight: 400,
                        }}
                      >
                        No one voted
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
