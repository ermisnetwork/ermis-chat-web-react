import React from 'react';
import { Divider, Stack, Typography, useTheme } from '@mui/material';
import ProfileMenu from './ProfileMenu';
import NewChatMenu from './NewChatMenu';
import { useSelector } from 'react-redux';
import { TabType } from '../../constants/commons-const';
import useResponsive from '../../hooks/useResponsive';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();
  const isMobileToMd = useResponsive('down', 'md');
  const theme = useTheme();
  const { tab } = useSelector(state => state.app);

  const renderTitle = () => {
    switch (tab) {
      case TabType.Chat:
        return t('renderTitle.conversations');
      case TabType.Contact:
        return t('renderTitle.contacts');
      case TabType.Call:
        return t('renderTitle.calls');
      case TabType.More:
        return t('renderTitle.more');
      default:
        return t('renderTitle.conversations');
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ width: '100%', height: '70px', padding: '0 15px', borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <Typography
        variant="h5"
        sx={{ fontSize: isMobileToMd ? '15px!important' : '32px!important', textTransform: 'uppercase' }}
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
