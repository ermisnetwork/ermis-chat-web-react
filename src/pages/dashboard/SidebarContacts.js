import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Stack, Typography } from '@mui/material';
import { MagnifyingGlass } from 'phosphor-react';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { PeopleIcon, UserSupportIcon, DeviceMessageIcon } from '../../components/Icons';
import { SetSearchQuery } from '../../redux/slices/app';
import { ChatType, ContactType, RoleMember } from '../../constants/commons-const';
import useResponsive from '../../hooks/useResponsive';

const SidebarContacts = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobileToMd = useResponsive('down', 'md');
  const { activeChannels = [], pendingChannels = [], pinnedChannels = [] } = useSelector(state => state.channel);
  const { searchQuery } = useSelector(state => state.app);
  const { user_id } = useSelector(state => state.auth);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Friend list: direct channels có owner khác mình
  const directChannels = useMemo(() => {
    return [...activeChannels, ...pinnedChannels].filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const otherMember = Object.values(channel.state.members).find(member => member.user_id !== user_id);
      return isDirect && otherMember && otherMember.channel_role === RoleMember.OWNER;
    });
  }, [activeChannels, pinnedChannels, user_id]);

  // Channels list: type là team
  const teamChannels = useMemo(() => {
    return [...activeChannels, ...pinnedChannels].filter(channel => channel.type === ChatType.TEAM);
  }, [activeChannels, pinnedChannels]);

  // Friend/Channel Request: số lượng pendingChannels
  const requestCount = pendingChannels.length;

  const buttonList = [
    {
      key: ContactType.Friends,
      label: 'Friends list',
      icon: <PeopleIcon color={theme.palette.text.primary} />,
      count: directChannels.length,
    },
    {
      key: ContactType.Channels,
      label: 'Channels list',
      icon: <DeviceMessageIcon color={theme.palette.text.primary} />,
      count: teamChannels.length,
    },
    {
      key: ContactType.Request,
      label: 'Friend/Channel Request',
      icon: <UserSupportIcon color={theme.palette.text.primary} />,
      count: requestCount,
    },
  ];

  const onClickButton = key => {
    window.location.hash = key;
  };

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
      <Stack spacing={2}>
        {!isMobileToMd && (
          <Search>
            <SearchIconWrapper>{<MagnifyingGlass size={18} />}</SearchIconWrapper>
            <StyledInputBase
              placeholder="Search"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={e => dispatch(SetSearchQuery(e.target.value))}
              sx={{ height: '48px' }}
            />
          </Search>
        )}

        {buttonList.map(item => (
          <Button
            key={item.key}
            variant={currentHash.replace('#', '') === item.key ? 'contained' : 'text'}
            fullWidth
            size="large"
            sx={{ justifyContent: 'space-between', padding: '12px', borderRadius: '12px' }}
            color="inherit"
            onClick={() => onClickButton(item.key)}
          >
            <Stack direction="row" alignItems="center">
              {item.icon}
              <Typography
                variant="subtitle1"
                sx={{
                  marginLeft: 1,
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                }}
              >
                {item.label}
              </Typography>
            </Stack>
            <Badge
              badgeContent={item.count}
              color={item.key === ContactType.Request ? 'primary' : 'default'}
              sx={{ marginRight: '11px', color: theme.palette.text.primary }}
            />
          </Button>
        ))}
      </Stack>
    </Stack>
  );
};

export default SidebarContacts;
