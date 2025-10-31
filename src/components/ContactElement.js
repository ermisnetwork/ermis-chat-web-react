import React, { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import ChannelAvatar from './ChannelAvatar';
import { AvatarShape } from '../constants/commons-const';
import { isChannelDirect } from '../utils/commons';
import useOnlineStatus from '../hooks/useOnlineStatus';
import CustomCheckbox from './CustomCheckbox';
import { useTranslation } from 'react-i18next';

const StyledContactItem = styled(Box)(({ theme }) => ({
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

const ContactElement = ({
  channel,
  avatarSize = 44,
  primaryFontSize = '14px',
  secondaryFontSize = '12px',
  onCheck = null,
  onSelect = () => {},
  selectedUsers = [],
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user_id } = useSelector(state => state.auth);
  const isDirect = isChannelDirect(channel);

  const members = useMemo(() => Object.values(channel.state.members) || [], [channel]);
  const otherMember = useMemo(() => members.find(member => member.user_id !== user_id), [members, user_id]);

  const otherMemberId = otherMember?.user_id || '';
  const otherMemberName = otherMember?.user?.name || otherMember?.user_id || '';
  const otherMemberAvatar = otherMember?.user?.avatar || '';
  const onlineStatus = useOnlineStatus(otherMemberId || '');

  const toggleUser = (user, selectedUsers = []) => {
    if (!user?.id) return selectedUsers;
    if (selectedUsers.some(u => u.id === user.id)) {
      return selectedUsers.filter(u => u.id !== user.id);
    }
    return [...selectedUsers, user];
  };

  const onChangeCheckbox = value => {
    const userObj = { id: otherMemberId, name: otherMemberName, avatar: otherMemberAvatar };
    const newSelected = toggleUser(userObj, selectedUsers);
    onCheck(userObj, newSelected);
  };

  const onClickContactItem = () => {
    const userObj = { id: otherMemberId, name: otherMemberName, avatar: otherMemberAvatar };
    if (onCheck) {
      const newSelected = toggleUser(userObj, selectedUsers);
      onCheck(userObj, newSelected);
    } else {
      onSelect({ channel, user: isDirect ? userObj : null });
    }
  };

  return (
    <StyledContactItem onClick={onClickContactItem}>
      <Stack direction="row" alignItems="center" gap={onCheck ? 1 : 2} sx={{ width: '100%' }}>
        {onCheck && (
          <CustomCheckbox
            checked={selectedUsers.some(u => u.id === otherMemberId)}
            onClick={e => e.stopPropagation()}
            onChange={onChangeCheckbox}
            sx={{ padding: 0 }}
          />
        )}
        <ChannelAvatar channel={channel} width={avatarSize} height={avatarSize} shape={AvatarShape.Round} />

        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden', paddingLeft: !isDirect ? '10px' : '0px' }}>
          <Typography
            variant="subtitle2"
            sx={{
              width: '100%',
              display: 'block',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: primaryFontSize,
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
              fontSize: secondaryFontSize,
              fontWeight: 400,
            }}
          >
            {!isDirect ? `${channel.data?.member_count} ${t('contactElement.member')}` : <>{t(onlineStatus)}</>}
          </Typography>
        </Stack>
      </Stack>
    </StyledContactItem>
  );
};

export default ContactElement;
