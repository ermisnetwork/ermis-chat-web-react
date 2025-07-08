import React from 'react';
import { Button, Stack, Typography, Box, useTheme } from '@mui/material';
import NoChat from '../../assets/Illustration/NoChat';
import { useDispatch, useSelector } from 'react-redux';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../../redux/slices/dialog';
import useResponsive from '../../hooks/useResponsive';
import { NewChatIcon, PeopleIcon } from '../../components/Icons';

const GeneralApp = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobileToMd = useResponsive('down', 'md');

  if (isMobileToMd) return null;

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        // backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        borderRadius: '16px',
        minWidth: 'auto',
        flex: 1,
      }}
    >
      <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
        <NoChat />
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          Let the message fly!
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
          This space is waiting for your words — spark a conversation and build something great together.
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ marginTop: '15px' }}>
          <Button variant="outlined" size="large" onClick={() => dispatch(OpenDialogCreateChannel())} sx={{ gap: 1 }}>
            <PeopleIcon size={24} color={theme.palette.text.primary} />
            NEW CHANNEL
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => dispatch(OpenDialogNewDirectMessage())}
            sx={{ gap: 1 }}
          >
            <NewChatIcon size={24} color={theme.palette.text.primary} />
            NEW MESSAGE
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default GeneralApp;
