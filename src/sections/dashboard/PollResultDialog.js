import React from 'react';
import { useTheme } from '@emotion/react';
import {
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { setPollResult } from '../../redux/slices/dialog';
import MemberAvatar from '../../components/MemberAvatar';
import { AvatarShape } from '../../constants/commons-const';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { use } from 'react';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UserItem = ({ user }) => {
  const theme = useTheme();
  const onlineStatus = useOnlineStatus(user.id || '');

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <MemberAvatar
        member={{ name: user.name, avatar: user.avatar, id: user.id }}
        width={44}
        height={44}
        shape={AvatarShape.Round}
      />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {user.name}
        </Typography>
        {onlineStatus && (
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '12px',
            }}
          >
            {onlineStatus}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default function PollResultDialog() {
  const theme = useTheme();
  const { t } = useTranslation();
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
        {t('pollResultDialog.title')}
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ fontSize: '30px', marginBottom: '20px' }}>
          {question}
        </Typography>

        <Box sx={{ maxHeight: '400px', overflowY: 'auto' }} className="customScrollbar">
          <Stack spacing={2}>
            {results.map((item, index) => {
              const totalMembers = Object.values(currentChannel.state.members)?.length || 1;
              const percent = Math.round((item.users.length / totalMembers) * 100);
              return (
                <Stack
                  key={index}
                  spacing={2}
                  sx={{
                    padding: '15px',
                    borderRadius: '18px',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent={'space-between'} spacing={1}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: '16px',
                        }}
                      >
                        {item.text}
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '16px',
                        }}
                      >
                        {percent}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={totalMembers === 0 ? 0 : (item.users.length / totalMembers) * 100}
                      sx={{
                        mt: '4px',
                        height: 3,
                        borderRadius: 4,
                        background: theme.palette.background.default,
                        '& .MuiLinearProgress-bar': {
                          background: theme.palette.primary.main,
                        },
                      }}
                    />
                  </Box>

                  <Stack gap={1}>
                    {item.users.length ? (
                      item.users.map((user, idx) => <UserItem key={idx} user={user} />)
                    ) : (
                      <Typography
                        sx={{
                          fontStyle: 'italic',
                          fontSize: '14px',
                          color: theme.palette.text.secondary,
                          fontWeight: 400,
                        }}
                      >
                        {t('pollResultDialog.no_voted')}
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
