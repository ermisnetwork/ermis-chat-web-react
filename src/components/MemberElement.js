import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MemberAvatar from './MemberAvatar';
import { AvatarShape, RoleMember } from '../constants/commons-const';
import { CrownIcon, MinusCircleIcon } from './Icons';
import { X } from 'phosphor-react';
import CustomCheckbox from './CustomCheckbox';
import { useSelector } from 'react-redux';
import { myRoleInChannel } from '../utils/commons';
import { useTranslation } from 'react-i18next';

const StyledMemberItem = styled(Box)(({ theme }) => ({
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

const MemberElement = ({
  member,
  avatarSize = 44,
  primaryFontSize = '14px',
  secondaryFontSize = '12px',
  onRemoveMember = null,
  onUnbanMember = null,
  onSelectMember = null,
  onCheck = null,
  selectedMembers = [],
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const myRole = myRoleInChannel(currentChannel);

  const isVisibleCrown = [RoleMember.OWNER, RoleMember.MOD].includes(member.channel_role);
  const canCheck = onCheck !== null;
  const canUnban = onUnbanMember !== null;
  const canRemove =
    onRemoveMember &&
    ((myRole === RoleMember.OWNER && member.channel_role !== RoleMember.OWNER) ||
      (myRole === RoleMember.MOD && ![RoleMember.OWNER, RoleMember.MOD].includes(member.channel_role)));

  const onRemove = data => {
    onRemoveMember(data);
  };

  const onUnban = data => {
    onUnbanMember(data);
  };

  const toggleMember = (member, selectedMembers = []) => {
    if (!member?.user_id) return selectedMembers;
    if (selectedMembers.some(m => m.user_id === member.user_id)) {
      return selectedMembers.filter(m => m.user_id !== member.user_id);
    }
    return [...selectedMembers, member];
  };

  const onChangeCheckbox = value => {
    const newSelected = toggleMember(member, selectedMembers);
    onCheck(member, newSelected);
  };

  const onClickMemberItem = () => {
    if (canCheck) {
      const newSelected = toggleMember(member, selectedMembers);
      onCheck(member, newSelected);
    } else if (canRemove) {
      onRemove(member);
    } else if (canUnban) {
      onUnban(member);
    } else if (onSelectMember && user_id !== member.user_id) {
      onSelectMember(member.user);
    }
  };

  const textRoleMember = channel_role => {
    switch (channel_role) {
      case RoleMember.OWNER:
        return t('memberElement.owner');
      case RoleMember.MOD:
        return t('memberElement.moderator');
      case RoleMember.MEMBER:
        return t('memberElement.member');
      case RoleMember.PENDING:
        return t('memberElement.pending');
      default:
        return '';
    }
  };

  const getColorRole = channel_role => {
    switch (channel_role) {
      case RoleMember.OWNER:
        return theme.palette.primary.main;
      case RoleMember.MOD:
        return theme.palette.primary.main;
      case RoleMember.MEMBER:
        return theme.palette.text.secondary;
      case RoleMember.PENDING:
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <StyledMemberItem onClick={onClickMemberItem}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
        {onCheck && (
          <CustomCheckbox
            checked={selectedMembers.some(m => m.user_id === member.user_id)}
            onClick={e => e.stopPropagation()}
            onChange={onChangeCheckbox}
            sx={{ padding: 0 }}
          />
        )}

        {onUnbanMember && <MinusCircleIcon />}

        <MemberAvatar
          member={member.user}
          width={avatarSize}
          height={avatarSize}
          openLightbox={true}
          shape={AvatarShape.Round}
        />
        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography
              variant="subtitle2"
              sx={{
                minWidth: 'auto',
                overflow: 'hidden',
                fontSize: primaryFontSize,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {member.user.name}
            </Typography>
            {isVisibleCrown && <CrownIcon />}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: getColorRole(member.channel_role),
              fontSize: secondaryFontSize,
              fontWeight: 400,
            }}
          >
            {textRoleMember(member.channel_role)}
          </Typography>
        </Stack>

        {canRemove && <X size={18} />}
      </Stack>
    </StyledMemberItem>
  );
};

export default MemberElement;
