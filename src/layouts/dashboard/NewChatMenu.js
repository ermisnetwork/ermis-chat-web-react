import React from 'react';
import { Box, Button, Fade, IconButton, Menu, MenuItem, Stack, useTheme } from '@mui/material';
import { NewChat_Menu } from '../../data';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage, OpenAddFriendDialog } from '../../redux/slices/dialog';
import Iconify from '../../components/Iconify';
import useResponsive from '../../hooks/useResponsive';
import { NewChatIcon, ProfileAddIcon } from '../../components/Icons';

const NewChatMenu = () => {
  const { t } = useTranslation();
  const isMobileToLg = useResponsive('down', 'lg');
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItem = key => {
    switch (key) {
      case 'new_channel':
        dispatch(OpenDialogCreateChannel());
        break;
      case 'new_message':
        dispatch(OpenDialogNewDirectMessage());
        break;
      default:
        break;
    }
  };

  const handleAddFriend = () => {
    dispatch(OpenAddFriendDialog());
  };

  return (
    <>
      {isMobileToLg ? (
        <IconButton onClick={handleAddFriend}>
          <ProfileAddIcon size={30} />
        </IconButton>
      ) : (
        <Button
          size="large"
          variant="outlined"
          sx={{ textTransform: 'uppercase' }}
          startIcon={<ProfileAddIcon size={24} color={theme.palette.primary.main} />}
          onClick={handleAddFriend}
        >
          {t('newchat.add_friend')}
        </Button>
      )}
      {isMobileToLg ? (
        <IconButton onClick={handleClick}>
          <NewChatIcon size={30} />
        </IconButton>
      ) : (
        <Button
          size="large"
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="ph:plus-bold" width={20} height={20} />}
          sx={{ marginRight: '15px!important', textTransform: 'uppercase' }}
          onClick={handleClick}
        >
          {t('newchat.new_chat')}
        </Button>
      )}

      <Menu
        MenuListProps={{
          'aria-labelledby': 'fade-button',
        }}
        TransitionComponent={Fade}
        id="new-chat-positioned-menu"
        aria-labelledby="new-chat-positioned-button"
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box p={1}>
          <Stack spacing={1}>
            {NewChat_Menu.map((el, idx) => (
              <MenuItem onClick={handleClose} key={idx} sx={{ fontSize: '16px' }}>
                <Stack
                  onClick={() => handleMenuItem(el.key)}
                  sx={{ width: '100%' }}
                  direction="row"
                  alignItems={'center'}
                  spacing={2}
                >
                  {el.icon}
                  <span>{t(el.title)}</span>
                </Stack>
              </MenuItem>
            ))}
          </Stack>
        </Box>
      </Menu>
    </>
  );
};

export default NewChatMenu;
