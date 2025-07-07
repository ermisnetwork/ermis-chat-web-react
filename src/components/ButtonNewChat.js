import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@emotion/react';
import { Menu, MenuItem, Button } from '@mui/material';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../redux/slices/dialog';
import { Plus, User, UsersThree } from 'phosphor-react';

export default function ButtonNewChat() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);

  const onOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
  };

  const openMenu = Boolean(anchorEl);

  return (
    <>
      <Button
        color="primary"
        size="large"
        variant="contained"
        sx={{
          minWidth: '50px',
          height: '50px',
          borderRadius: '50%',
          padding: 0,
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          zIndex: 1,
        }}
        onClick={onOpenMenu}
      >
        <Plus
          style={{ color: '#fff', transition: 'all .2s', transform: openMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
          size={22}
        />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={onCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            dispatch(OpenDialogCreateChannel());
            onCloseMenu();
          }}
        >
          <span style={{ width: '26px' }}>
            <UsersThree size={22} />
          </span>
          <span style={{ fontSize: 14, marginLeft: 10 }}>New channel</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            dispatch(OpenDialogNewDirectMessage());
            onCloseMenu();
          }}
        >
          <span style={{ width: '26px' }}>
            <User size={18} />
          </span>
          <span style={{ fontSize: 14, marginLeft: 10 }}>New direct message</span>
        </MenuItem>
      </Menu>
    </>
  );
}
