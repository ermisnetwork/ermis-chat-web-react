import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import { useState, useEffect, useMemo } from 'react';
import { AvatarShape, ChatType, OnlineStatusUser } from '../constants/commons-const';
import { useSelector } from 'react-redux';
import useOnlineStatus from '../hooks/useOnlineStatus';
import ImageCanvas from './ImageCanvas';
import AvatarDefault from './AvatarDefault';
import { Box } from '@mui/material';

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

function TeamAvatarBox({ member1, member2, width = 48, height = 48, shape = 'circle', styleCustom = {} }) {
  const sizeMember1 = Math.round(width * 0.625);
  const sizeMember2 = Math.round(width * 0.71875);

  return (
    <Box sx={{ position: 'relative', width: width, height: height }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          width: sizeMember1,
          height: sizeMember1,
        }}
      >
        {member1.avatar ? (
          <ImageCanvas dataUrl={member1.avatar} width={sizeMember1} height={sizeMember1} styleCustom={styleCustom} />
        ) : (
          <AvatarDefault name={member1.name} width={sizeMember1} height={sizeMember1} shape={shape} />
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: 2,
          width: sizeMember2,
          height: sizeMember2,
        }}
      >
        {member2.avatar ? (
          <ImageCanvas dataUrl={member2.avatar} width={sizeMember2} height={sizeMember2} styleCustom={styleCustom} />
        ) : (
          <AvatarDefault name={member2.name} width={sizeMember2} height={sizeMember2} shape={shape} />
        )}
      </Box>
    </Box>
  );
}

export default function ChannelAvatar({ channel, width, height, openLightbox, shape = 'circle' }) {
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const [groupMemberFirst, setGroupMemberFirst] = useState({ name: '', avatar: null });
  const [groupMemberSecond, setGroupMemberSecond] = useState({ name: '', avatar: null });

  const isDirect = channel?.type === ChatType.MESSAGING;
  const channelAvatar = channel.data?.image || '';

  const directMembers = useMemo(
    () => (isDirect ? Object.values(channel.state.members) : []),
    [channel?.state?.members, isDirect],
  );

  const otherMemberInDirect = useMemo(
    () => directMembers.find(member => member.user_id !== user_id),
    [directMembers, user_id],
  );

  const otherMemberId = otherMemberInDirect?.user_id;
  const onlineStatus = useOnlineStatus(isDirect ? otherMemberId : '');

  useEffect(() => {
    if (!isDirect) {
      const members = Object.values(channel?.state?.members) || [];
      const firstMember = members ? members[0] : null;
      if (firstMember) {
        setGroupMemberFirst({
          name: firstMember ? firstMember.user.name : firstMember.user.id,
          avatar: firstMember ? firstMember.user.avatar : null,
        });
      } else {
        setGroupMemberFirst({ name: '', avatar: null });
      }
      const secondMember = members ? members[1] : null;
      if (secondMember) {
        setGroupMemberSecond({
          name: secondMember ? secondMember.user.name : secondMember.user.id,
          avatar: secondMember ? secondMember.user.avatar : null,
        });
      } else {
        setGroupMemberSecond({ name: '', avatar: null });
      }
    }
  }, [channel?.state?.members, isDirect, user_id]);

  const getSizeSmallAvatar = size => {
    return (62.5 * size) / 100;
  };

  const getSizeBadgeOnline = size => {
    return `${size / 5}px`;
  };

  const styleCustom = {
    borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
    border: `1px solid ${theme.palette.background.paper}`,
  };

  if (!channel) return null;

  return (
    <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
      {isDirect ? (
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
          {otherMemberInDirect.user?.avatar ? (
            <ImageCanvas
              dataUrl={otherMemberInDirect.user?.avatar}
              width={width}
              height={height}
              styleCustom={styleCustom}
              openLightbox={openLightbox}
            />
          ) : (
            <AvatarDefault name={otherMemberInDirect.user?.name} width={width} height={height} shape={shape} />
          )}
        </StyledBadgeOnline>
      ) : channelAvatar ? (
        <ImageCanvas
          dataUrl={channelAvatar}
          width={width}
          height={height}
          styleCustom={styleCustom}
          openLightbox={openLightbox}
        />
      ) : (
        <TeamAvatarBox
          member1={groupMemberFirst}
          member2={groupMemberSecond}
          width={width}
          height={height}
          shape={shape}
          styleCustom={styleCustom}
        />
      )}
    </Stack>
  );
}
