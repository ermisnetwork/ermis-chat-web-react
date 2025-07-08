import React from 'react';
import { Box, useTheme, Typography } from '@mui/material';
import { formatString, isPublicChannel } from '../utils/commons';
import AvatarComponent from './AvatarComponent';
import ChannelAvatar from './ChannelAvatar';
import { AvatarShape } from '../constants/commons-const';

const NoMessageBox = ({ channel }) => {
  const theme = useTheme();

  if (!channel) return null;

  const isPublic = isPublicChannel(channel);

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
      {isPublic ? (
        <AvatarComponent
          name={channel.data.name}
          url={channel.data.image}
          width={90}
          height={90}
          isPublic={isPublic}
          openLightbox={false}
          shape={AvatarShape.Round}
        />
      ) : (
        <ChannelAvatar channel={channel} width={90} height={90} openLightbox={false} />
      )}
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {formatString(channel.data.name)}
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{
          fontSize: '14px',
          color: 'text.secondary',
          fontWeight: 400,
        }}
      >
        Let start this conversations with great stories!
      </Typography>
    </Box>
  );
};

export default NoMessageBox;
