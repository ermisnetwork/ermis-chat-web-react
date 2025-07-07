import React from 'react';
import { Divider, Stack, Typography, useTheme } from '@mui/material';
import ProfileMenu from './ProfileMenu';
import NewChatMenu from './NewChatMenu';
import { useSelector } from 'react-redux';
import { TabType } from '../../constants/commons-const';
import useResponsive from '../../hooks/useResponsive';

const Header = () => {
  const isMobileToMd = useResponsive('down', 'md');
  const theme = useTheme();
  const { tab } = useSelector(state => state.app);

  const renderTitle = () => {
    switch (tab) {
      case TabType.Chat:
        return 'Conversations';
      case TabType.Contact:
        return 'Contacts';
      case TabType.Call:
        return 'Calls';
      case TabType.More:
        return 'More';
      default:
        return 'Conversations';
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ width: '100%', height: '98px', padding: '0 15px', borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <Typography
        variant="h5"
        sx={{ fontSize: isMobileToMd ? '18px!important' : '32px!important', textTransform: 'uppercase' }}
      >
        {renderTitle()}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={isMobileToMd ? 1 : 2}>
        <NewChatMenu />
        <Divider orientation="vertical" flexItem />
        <ProfileMenu />
      </Stack>
    </Stack>
  );
};

export default Header;
