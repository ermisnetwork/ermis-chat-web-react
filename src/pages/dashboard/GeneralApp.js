import React from 'react';
import { Button, Stack, Typography, Box, useTheme } from '@mui/material';
import NoChat from '../../assets/Illustration/NoChat';
import { useDispatch, useSelector } from 'react-redux';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../../redux/slices/dialog';
import { User, UsersThree } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';

const GeneralApp = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobileToMd = useResponsive('down', 'md');

  const { projectCurrent } = useSelector(state => state.wallet);

  if (isMobileToMd) return null;

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        borderRadius: '16px',
        minWidth: 'auto',
        flex: 1,
      }}
    >
      <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
        <NoChat />
        <Typography variant="subtitle2">
          {projectCurrent ? (
            <>
              Select a conversation or start a new one
              <br />
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ marginTop: '15px' }}>
                <Button
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                  onClick={() => dispatch(OpenDialogCreateChannel())}
                >
                  <UsersThree size={20} />
                  &nbsp;New channel
                </Button>
                <Button
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                  onClick={() => dispatch(OpenDialogNewDirectMessage())}
                >
                  <User size={16} />
                  &nbsp;New direct
                </Button>
              </Stack>
            </>
          ) : (
            'Please select a project to start chatting.'
          )}
        </Typography>
      </Stack>
    </Box>
  );
};

export default GeneralApp;
