import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { styled, useTheme } from '@mui/material/styles';
import { Badge, Stack, Box } from '@mui/material';
import PropTypes from 'prop-types';

import { AvatarShape, ChatType, OnlineStatusUser } from '../constants/commons-const';
import useOnlineStatus from '../hooks/useOnlineStatus';
import AvatarComponent from './AvatarComponent';
import AvatarDefault from './AvatarDefault';
import AvatarGeneralDefault from './AvatarGeneralDefault';
import ImageCanvas from './ImageCanvas';
import TopicAvatar from './TopicAvatar';
import { TRANSITION } from '../config';

const StyledBadgeOnline = styled(Badge, {
  shouldForwardProp: prop => prop !== 'status',
})(({ theme, status }) => {
  const colors = {
    [OnlineStatusUser.ONLINE]: '#44b700',
    [OnlineStatusUser.OFFLINE]: '#ddd',
    [OnlineStatusUser.UNKNOWN]: 'transparent',
  };

  const backgroundColor = colors[status] || 'transparent';
  const hasBoxShadow = status !== OnlineStatusUser.UNKNOWN;

  return {
    '& .MuiBadge-badge': {
      backgroundColor,
      color: backgroundColor,
      boxShadow: hasBoxShadow ? `0 0 0 2px ${theme.palette.background.paper}` : 'none',
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
  };
});

const TeamAvatarBox = ({ member1, member2, width = 48, height = 48, shape = 'circle', styleCustom = {} }) => {
  const sizes = useMemo(
    () => ({
      member1: Math.round(width * 0.625),
      member2: Math.round(width * 0.71875),
    }),
    [width],
  );

  return (
    <Box sx={{ position: 'relative', width, height, transition: TRANSITION }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          width: sizes.member1,
          height: sizes.member1,
          transition: TRANSITION,
        }}
      >
        {member1.avatar ? (
          <ImageCanvas
            dataUrl={member1.avatar}
            width={sizes.member1}
            height={sizes.member1}
            styleCustom={styleCustom}
          />
        ) : (
          <AvatarDefault name={member1.name} width={sizes.member1} height={sizes.member1} shape={shape} />
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: 2,
          width: sizes.member2,
          height: sizes.member2,
          transition: TRANSITION,
        }}
      >
        {member2.avatar ? (
          <ImageCanvas
            dataUrl={member2.avatar}
            width={sizes.member2}
            height={sizes.member2}
            styleCustom={styleCustom}
          />
        ) : (
          <AvatarDefault name={member2.name} width={sizes.member2} height={sizes.member2} shape={shape} />
        )}
      </Box>
    </Box>
  );
};

export default function ChannelAvatar({
  channel,
  width,
  height,
  openLightbox,
  shape = AvatarShape.Circle,
  showGeneralDefault = false,
}) {
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);

  const channelData = useMemo(
    () => ({
      isDirect: channel?.type === ChatType.MESSAGING,
      channelAvatar: channel?.data?.image || '',
      isPublic: channel?.data?.public,
      isChannelTopic: channel?.type === ChatType.TOPIC,
      isEnabledTopics: channel?.data?.topics_enabled,
    }),
    [channel?.type, channel?.data?.image, channel?.data?.topics_enabled, channel?.data?.public],
  );

  const { isDirect, channelAvatar, isPublic, isChannelTopic, isEnabledTopics } = channelData;

  const directMembers = useMemo(
    () => (isDirect ? Object.values(channel?.state?.members || {}) : []),
    [channel?.state?.members, isDirect],
  );

  const otherMemberInDirect = useMemo(
    () => directMembers.find(member => member.user_id !== user_id),
    [directMembers, user_id],
  );

  const otherMemberId = otherMemberInDirect?.user_id;
  const onlineStatus = useOnlineStatus(isDirect ? otherMemberId : '');

  // Process group members for non-direct channels
  const groupMembers = useMemo(() => {
    if (isDirect) return { first: { name: '', avatar: null }, second: { name: '', avatar: null } };

    const members = Object.values(channel?.state?.members || {});
    const [firstMember, secondMember] = members;

    return {
      first: firstMember
        ? {
            name: firstMember.user?.name || firstMember.user?.id || '',
            avatar: firstMember.user?.avatar || null,
          }
        : { name: '', avatar: null },
      second: secondMember
        ? {
            name: secondMember.user?.name || secondMember.user?.id || '',
            avatar: secondMember.user?.avatar || null,
          }
        : { name: '', avatar: null },
    };
  }, [channel?.state?.members, isDirect]);

  const getSizeSmallAvatar = useCallback(size => (62.5 * size) / 100, []);
  const getSizeBadgeOnline = useCallback(size => `${size / 5}px`, []);

  const styleCustom = useMemo(
    () => ({
      borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
      border: `1px solid ${theme.palette.background.paper}`,
    }),
    [shape, theme.palette.background.paper],
  );

  const renderedAvatar = useMemo(() => {
    if (isDirect) {
      if (!otherMemberInDirect) return null;

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
          {otherMemberInDirect.user?.avatar ? (
            <ImageCanvas
              dataUrl={otherMemberInDirect.user.avatar}
              width={width}
              height={height}
              styleCustom={styleCustom}
              openLightbox={openLightbox}
            />
          ) : (
            <AvatarDefault name={otherMemberInDirect.user?.name} width={width} height={height} shape={shape} />
          )}
        </StyledBadgeOnline>
      );
    }

    if (isChannelTopic) {
      return (
        <TopicAvatar
          url={channel?.data?.image}
          name={channel?.data?.name}
          size={width}
          shape={shape}
          openLightbox={openLightbox}
        />
      );
    }

    if (showGeneralDefault && isEnabledTopics) {
      return <AvatarGeneralDefault size={width} />;
    }

    if (isPublic) {
      return (
        <AvatarComponent
          name={channel?.data?.name}
          url={channel?.data?.image || ''}
          width={width}
          height={height}
          isPublic={isPublic}
          openLightbox={openLightbox}
          shape={shape}
        />
      );
    }

    if (channelAvatar) {
      return (
        <ImageCanvas
          dataUrl={channelAvatar}
          width={width}
          height={height}
          styleCustom={styleCustom}
          openLightbox={openLightbox}
        />
      );
    }

    return (
      <TeamAvatarBox
        member1={groupMembers.first}
        member2={groupMembers.second}
        width={width}
        height={height}
        shape={shape}
        styleCustom={styleCustom}
      />
    );
  }, [
    isDirect,
    otherMemberInDirect,
    onlineStatus,
    width,
    height,
    styleCustom,
    openLightbox,
    isChannelTopic,
    channel?.data,
    showGeneralDefault,
    isEnabledTopics,
    isPublic,
    channelAvatar,
    groupMembers,
    shape,
    getSizeBadgeOnline,
  ]);

  if (!channel) return null;

  return (
    <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
      {renderedAvatar}
    </Stack>
  );
}

// PropTypes validation
ChannelAvatar.propTypes = {
  channel: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  openLightbox: PropTypes.bool,
  shape: PropTypes.oneOf([AvatarShape.Circle, AvatarShape.Round]),
  showGeneralDefault: PropTypes.bool,
};

TeamAvatarBox.propTypes = {
  member1: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
  member2: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  shape: PropTypes.string,
  styleCustom: PropTypes.object,
};
