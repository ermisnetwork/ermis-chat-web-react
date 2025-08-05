import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { AvatarShape } from '../constants/commons-const';
import CustomCheckbox from './CustomCheckbox';
import MemberAvatar from './MemberAvatar';
import useOnlineStatus from '../hooks/useOnlineStatus';

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

const UserElement = ({
  user,
  avatarSize = 44,
  primaryFontSize = '14px',
  secondaryFontSize = '12px',
  onCheck = null,
  onSelect = () => {},
  selectedUsers = [],
}) => {
  const theme = useTheme();
  const onlineStatus = useOnlineStatus(user.id || '');

  const toggleUser = (user, selectedUsers = []) => {
    if (!user?.id) return selectedUsers;
    if (selectedUsers.some(u => u.id === user.id)) {
      return selectedUsers.filter(u => u.id !== user.id);
    }
    return [...selectedUsers, user];
  };

  const onChangeCheckbox = value => {
    const newSelected = toggleUser(user, selectedUsers);
    onCheck(user, newSelected);
  };

  const onClickUserItem = () => {
    if (onCheck) {
      const newSelected = toggleUser(user, selectedUsers);
      onCheck(user, newSelected);
    } else {
      onSelect({ channel: null, user });
    }
  };

  return (
    <StyledContactItem onClick={onClickUserItem}>
      <Stack direction="row" alignItems="center" gap={onCheck ? 1 : 2} sx={{ width: '100%' }}>
        {onCheck && (
          <CustomCheckbox
            checked={selectedUsers.some(u => u.id === user.id)}
            onClick={e => e.stopPropagation()}
            onChange={onChangeCheckbox}
            sx={{ padding: 0 }}
          />
        )}
        <MemberAvatar member={user} width={avatarSize} height={avatarSize} shape={AvatarShape.Round} />

        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
          <Typography
            variant="subtitle2"
            sx={{
              width: '100%',
              display: 'block',
              fontSize: primaryFontSize,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.name}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: secondaryFontSize,
              fontWeight: 400,
            }}
          >
            {onlineStatus}
          </Typography>
        </Stack>
      </Stack>
    </StyledContactItem>
  );
};

export default UserElement;
