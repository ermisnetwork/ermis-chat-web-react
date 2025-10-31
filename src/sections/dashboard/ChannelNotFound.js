import { Stack, Typography, Button, useTheme } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import NoData from '../../assets/Illustration/NoData';
import { useDispatch } from 'react-redux';
import { setCurrentChannelStatus } from '../../redux/slices/channel';
import { CurrentChannelStatus } from '../../constants/commons-const';
import { useTranslation } from 'react-i18next';

const ChannelNotFound = () => {
  const { t } = useTranslation();
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
          {t('channelNotFound.title')}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ fontSize: '18px', textAlign: 'center', color: theme.palette.text.secondary }}
        >
          {t('channelNotFound.message_up')} <br /> {t('channelNotFound.message_down')}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" sx={{ textTransform: 'none' }} onClick={onGoBack}>
            {t('channelNotFound.btn_message')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ChannelNotFound;
