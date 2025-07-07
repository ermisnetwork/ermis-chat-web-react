import React from 'react';
import { Box, Button, Fade, Menu, MenuItem, Stack, Typography, useTheme } from '@mui/material';

import { Profile_Menu } from '../../data';
import { useDispatch, useSelector } from 'react-redux';
import { LogoutUser } from '../../redux/slices/auth';
import { OpenDialogProfile } from '../../redux/slices/dialog';
import MemberAvatar from '../../components/MemberAvatar';
import { formatString } from '../../utils/commons';
import Iconify from '../../components/Iconify';
import useResponsive from '../../hooks/useResponsive';

const ProfileMenu = () => {
  const isMobileToMd = useResponsive('down', 'md');
  const theme = useTheme();
  const { myUserInfo } = useSelector(state => state.member);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuWidth, setMenuWidth] = React.useState(undefined);
  const stackRef = React.useRef(null);
  const openMenu = Boolean(anchorEl);
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
    if (stackRef.current) {
      setMenuWidth(stackRef.current.offsetWidth);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    dispatch(LogoutUser());
  };

  const handleMenuItem = key => {
    switch (key) {
      case 'profile':
        dispatch(OpenDialogProfile());
        break;
      case 'saved_messages':
        break;
      case 'blocked_contacts':
        break;
      case 'logout':
        onLogout();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Button ref={stackRef} variant="text" color="inherit" onClick={handleClick}>
        <MemberAvatar member={myUserInfo} width={isMobileToMd ? 30 : 40} height={isMobileToMd ? 30 : 40} />
        {!isMobileToMd && (
          <Typography variant="subtitle1" sx={{ fontSize: '16px', padding: '0px 8px', textTransform: 'lowercase' }}>
            {formatString(myUserInfo.name)}
          </Typography>
        )}

        <Iconify icon="iconamoon:arrow-down-2-fill" width={isMobileToMd ? 16 : 20} height={isMobileToMd ? 16 : 20} />
      </Button>

      <Menu
        MenuListProps={{
          'aria-labelledby': 'fade-button',
        }}
        TransitionComponent={Fade}
        id="profile-positioned-menu"
        aria-labelledby="profile-positioned-button"
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
        PaperProps={{
          style: {
            minWidth: menuWidth,
          },
        }}
      >
        <Box p={1}>
          <Stack spacing={1}>
            {Profile_Menu.map((el, idx) => (
              <MenuItem onClick={handleClose} key={idx} sx={{ fontSize: '16px' }}>
                <Stack
                  onClick={() => handleMenuItem(el.key)}
                  sx={{ width: '100%' }}
                  direction="row"
                  alignItems={'center'}
                  spacing={2}
                >
                  {el.icon}
                  <span style={{ color: el.key === 'logout' ? theme.palette.error.main : 'inherit' }}>{el.title}</span>
                </Stack>
              </MenuItem>
            ))}
          </Stack>
        </Box>
      </Menu>
    </>
  );
};

export default ProfileMenu;
