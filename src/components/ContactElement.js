import React, { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from './ChannelAvatar';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import { AvatarShape } from '../constants/commons-const';
import { isChannelDirect } from '../utils/commons';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { SetSearchQuery } from '../redux/slices/app';

const StyledChatBox = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  padding: '5px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
}));

const ContactElement = ({ channel }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user_id } = useSelector(state => state.auth);

  const channelId = channel.data.id;
  const channelType = channel.data.type;
  const isDirect = isChannelDirect(channel);

  const members = useMemo(() => (isDirect ? Object.values(channel.state.members) : []), [channel, isDirect]);
  const otherMember = useMemo(() => members.find(member => member.user_id !== user_id), [members, user_id]);
  const otherMemberId = otherMember?.user_id;
  const onlineStatus = useOnlineStatus(isDirect ? otherMemberId : '');

  const onLeftClick = () => {
    navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
    dispatch(SetSearchQuery(''));
  };

  return (
    <StyledChatBox onClick={onLeftClick}>
      <Stack direction="row" alignItems="center" gap={2} sx={{ width: '100%' }}>
        <ChannelAvatar channel={channel} width={60} height={60} shape={AvatarShape.Round} />

        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden', paddingLeft: !isDirect ? '10px' : '0px' }}>
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
            {!isDirect ? `${channel.data?.member_count} members` : <>{onlineStatus}</>}
          </Typography>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

export default ContactElement;
