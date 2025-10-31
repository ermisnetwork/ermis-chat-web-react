import React from 'react';
import { alpha, Box, Button, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import ChannelAvatar from './ChannelAvatar';
import { AvatarShape } from '../constants/commons-const';
import { handleError, isChannelDirect } from '../utils/commons';
import useResponsive from '../hooks/useResponsive';
import { showSnackbar } from '../redux/slices/app';
import { useTranslation } from 'react-i18next';

const InviteElement = ({ channel }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobileToLg = useResponsive('down', 'lg');
  const isDirect = isChannelDirect(channel);

  const onSkip = async () => {
    try {
      await channel.skipInvite();
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('inviteElement.snackbar_onSkip_success'),
        }),
      );
    } catch (error) {
      handleError(dispatch, error,t);
    }
  };

  const onDecline = async () => {
    try {
      await channel.rejectInvite();
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('inviteElement.snackbar_onDecline_success'),
        }),
      );
    } catch (error) {
      handleError(dispatch, error, t);
    }
  };

  const onAccept = async () => {
    try {
      await channel.acceptInvite('accept');
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('inviteElement.snackbar_onAccept_success'),
        }),
      );
    } catch (error) {
      handleError(dispatch, error, t);
    }
  };

  return (
    <Stack direction="row" alignItems="center">
      <ChannelAvatar channel={channel} width={60} height={60} shape={AvatarShape.Round} />

      <Stack sx={{ width: 'calc(100% - 60px)', paddingLeft: '20px' }}>
        <Stack direction={isMobileToLg ? 'column' : 'row'} alignItems={isMobileToLg ? 'flex-start' : 'center'} gap={1}>
          <Box sx={{ flex: 1, minWidth: 'auto', overflow: 'hidden' }}>
            <Typography
              variant="subtitle2"
              sx={{
                width: '100%',
                display: 'block',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '18px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {channel.data.name}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              {!isDirect ? t('inviteElement.admin_invite') : t('inviteElement.message')}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={2} sx={{ width: '276px' }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                color: theme.palette.primary.main,
                width: '130px',
                boxShadow: 'none',
              }}
              onClick={isDirect ? onSkip : onDecline}
            >
              {isDirect ? t('inviteElement.skip') : t('inviteElement.decline')}
            </Button>

            <Button variant="contained" sx={{ width: '130px', boxShadow: 'none' }} onClick={onAccept}>
              {isDirect ? t('inviteElement.accept') : t('inviteElement.join')}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default InviteElement;
