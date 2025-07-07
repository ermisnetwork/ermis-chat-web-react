import { Stack, Typography, Button, useTheme } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import NoData from '../../assets/Illustration/NoData';
import { useDispatch } from 'react-redux';
import { setCurrentChannelStatus } from '../../redux/slices/channel';
import { CurrentChannelStatus } from '../../constants/commons-const';

const ChannelNotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch();

  const onGoBack = () => {
    dispatch(setCurrentChannelStatus(CurrentChannelStatus.IDLE));
    navigate(`${DEFAULT_PATH}`);
  };

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
      <NoData />
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontSize: '32px', textAlign: 'center' }}>
          CHANNEL NOT FOUND!
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ fontSize: '18px', textAlign: 'center', color: theme.palette.text.secondary }}
        >
          The link you accessed does not correspond to any existing chat channel. <br /> Please check the URL or go back
          to the main page.
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" sx={{ textTransform: 'none' }} onClick={onGoBack}>
            Go Back
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ChannelNotFound;
