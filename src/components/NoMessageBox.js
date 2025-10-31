import React from 'react';
import { Box, Typography } from '@mui/material';
import ChannelAvatar from './ChannelAvatar';
import { AvatarShape } from '../constants/commons-const';
import { useTranslation } from 'react-i18next';

const NoMessageBox = ({ channel }) => {
  const { t } = useTranslation();

  if (!channel) return null;

  return (
    <Box
      sx={{
        textAlign: 'center',
        position: 'absolute',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        maxWidth: 320,
      }}
    >
      <ChannelAvatar channel={channel} width={90} height={90} openLightbox={false} shape={AvatarShape.Round} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {channel?.data?.name}
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{
          fontSize: '14px',
          color: 'text.secondary',
          fontWeight: 400,
        }}
      >
        {t('noMessageBox.no_message')}
      </Typography>
    </Box>
  );
};

export default NoMessageBox;
