import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { IconButton, Stack, styled, Tabs, Typography, Tab } from '@mui/material';
import { CaretLeft, MagnifyingGlass } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType } from '../../redux/slices/app';
import { ConfirmType, RoleMember, SidebarType, TabValueMembers } from '../../constants/commons-const';
import { ProfileAddIcon } from '../../components/Icons';
import { setChannelConfirm, SetOpenInviteFriendDialog } from '../../redux/slices/dialog';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import MemberElement from '../../components/MemberElement';
import NoResult from '../../assets/Illustration/NoResult';
import { useTranslation } from 'react-i18next';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 'auto',
  backgroundColor: theme.palette.background.default,
  margin: '0 -24px',
  padding: '0 24px',
  '& .MuiTab-root': {
    marginRight: '0px!important',
    minWidth: 0,
    minHeight: 'auto',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '32px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.divider, 0.1),
      color: theme.palette.primary.main,
    },
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },

  '& .MuiTabs-indicator': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    height: '100%',
    borderRadius: '32px',
  },

  '& .MuiTabs-scrollButtons': {
    width: 'auto',
    borderRadius: '6px',
    padding: '2px',
  },
}));

const LIST_TAB = [
  { label: 'sidebarMembers.members', value: TabValueMembers.Members },
  { label: 'sidebarMembers.invite_members', value: TabValueMembers.InvitedMembers },
];

const TabMembers = ({ searchQuery }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const rolePriority = {
    owner: 1,
    moder: 2,
    member: 3,
  };

  const filteredMembers = members
    .filter(
      member =>
        member.channel_role !== RoleMember.PENDING &&
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      // So sánh theo thứ tự role trước
      if (rolePriority[a.channel_role] !== rolePriority[b.channel_role]) {
        return rolePriority[a.channel_role] - rolePriority[b.channel_role];
      }
      // Nếu role giống nhau, so sánh theo tên (alphabetical order)
      return a.user.name.localeCompare(b.user.name);
    });

  const onRemoveMember = member => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: member.user_id,
      type: ConfirmType.REMOVE_MEMBER,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <Stack spacing={1}>
      {filteredMembers.length > 0 ? (
        filteredMembers.map(member => (
          <MemberElement key={member.user_id} member={member} onRemoveMember={onRemoveMember} />
        ))
      ) : (
        <Stack sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <NoResult width={180} height={180} />
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: 14,
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {t('sidebarMembers.no_result')} {searchQuery ? `"${searchQuery}"` : ''}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

const TabInvitedMembers = ({ searchQuery }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const filteredInvitedMembers = members
    .filter(
      member =>
        member.channel_role === RoleMember.PENDING &&
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      return a.user.name.localeCompare(b.user.name);
    });

  const onRemoveMember = member => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: member.user_id,
      type: ConfirmType.REMOVE_MEMBER,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <Stack spacing={1}>
      {filteredInvitedMembers.length > 0 ? (
        filteredInvitedMembers.map(member => (
          <MemberElement key={member.user_id} member={member} onRemoveMember={onRemoveMember} />
        ))
      ) : (
        <Stack sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <NoResult width={180} height={180} />
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: 14,
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {t('sidebarMembers.no_result')} {searchQuery ? `"${searchQuery}"` : ''}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

const SidebarMembers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabSeledected, setTabSelected] = useState(TabValueMembers.Members);

  const renderTabContent = () => {
    switch (tabSeledected) {
      case TabValueMembers.Members:
        return <TabMembers searchQuery={searchQuery} />;
      case TabValueMembers.InvitedMembers:
        return <TabInvitedMembers searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  if (!currentChannel) return null;

  return (
    <Stack sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <IconButton
          onClick={() => {
            dispatch(UpdateSidebarType(SidebarType.Channel));
          }}
        >
          <CaretLeft size={20} color={theme.palette.text.primary} />
        </IconButton>

        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          {t('sidebarMembers.title')}
        </Typography>

        <IconButton
          onClick={() => {
            dispatch(SetOpenInviteFriendDialog(true));
          }}
        >
          <ProfileAddIcon size={20} color={theme.palette.text.primary} />
        </IconButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
        <Search>
          <SearchIconWrapper>{<MagnifyingGlass size={18} />}</SearchIconWrapper>
          <StyledInputBase
            placeholder={t('sidebarMembers.search')}
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ height: '48px' }}
            autoFocus
          />
        </Search>

        <StyledTabs
          value={tabSeledected}
          onChange={(event, newValue) => {
            setTabSelected(newValue);
          }}
          variant="standard"
        >
          {LIST_TAB.map((item, index) => {
            return <Tab key={index} value={item.value} label={t(item.label)} />;
          })}
        </StyledTabs>

        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            marginLeft: '-24px!important',
            marginRight: '-24px!important',
            padding: '0 24px',
            minHeight: 'auto',
            flex: 1,
          }}
        >
          <Stack spacing={2}>{renderTabContent()}</Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarMembers;
