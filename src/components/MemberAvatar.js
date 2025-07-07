import * as React from 'react';
import { Badge, styled, useTheme } from '@mui/material';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { AvatarShape, OnlineStatusUser } from '../constants/commons-const';
import ImageCanvas from './ImageCanvas';
import AvatarDefault from './AvatarDefault';

const StyledBadgeOnline = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor:
      status === OnlineStatusUser.ONLINE ? '#44b700' : status === OnlineStatusUser.OFFLINE ? '#ddd' : 'transparent',
    color:
      status === OnlineStatusUser.ONLINE ? '#44b700' : status === OnlineStatusUser.OFFLINE ? '#ddd' : 'transparent',
    boxShadow: status !== OnlineStatusUser.UNKNOWN ? `0 0 0 2px ${theme.palette.background.paper}` : 'none',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '1px solid currentColor',
      content: '""',
    },
  },
}));

export default function MemberAvatar({ member, width, height, openLightbox, shape = 'circle' }) {
  const theme = useTheme();
  const onlineStatus = useOnlineStatus(member?.id || '');

  const getSizeBadgeOnline = size => {
    return `${size / 5}px`;
  };

  if (!member) {
    return null;
  }

  return (
    <StyledBadgeOnline
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      sx={{
        '& .MuiBadge-badge': {
          minWidth: getSizeBadgeOnline(width),
          width: getSizeBadgeOnline(width),
          height: getSizeBadgeOnline(width),
        },
      }}
      status={onlineStatus}
    >
      {member.avatar ? (
        <ImageCanvas
          dataUrl={member.avatar}
          width={width}
          height={height}
          styleCustom={{
            borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
            border: `1px solid ${theme.palette.background.paper}`,
          }}
          openLightbox={openLightbox}
        />
      ) : (
        <AvatarDefault name={member.name} width={width} height={height} shape={shape} />
      )}
    </StyledBadgeOnline>
  );
}
