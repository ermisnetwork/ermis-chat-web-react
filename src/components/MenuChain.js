import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@emotion/react';
import { Menu, MenuItem, Button, styled } from '@mui/material';
import { CaretDown } from 'phosphor-react';
import { SetChainCurrent } from '../redux/slices/wallet';
import { CHAIN_ID } from '../constants/wallet-const';

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: '290px',
    borderRadius: '8px',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
    border: '1px solid rgba(145, 158, 171, 0.32)',
  },
}));

export default function MenuChain() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { chains, chainCurrent } = useSelector(state => state.wallet);

  const [anchorEl, setAnchorEl] = useState(null);

  const onOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
  };

  const onSelect = chainId => {
    const chain = chains.find(item => item.chain_id === chainId);
    dispatch(SetChainCurrent(chain));
    onCloseMenu();
  };

  const otherChains = chains.filter(item => item.chain_id !== CHAIN_ID.Ermis);
  const openMenu = Boolean(anchorEl);

  return (
    <>
      <Button
        id="chain-button"
        aria-controls={openMenu ? 'chain-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openMenu ? 'true' : undefined}
        fullWidth
        color="inherit"
        variant="outlined"
        sx={{
          textTransform: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
        }}
        onClick={onOpenMenu}
      >
        <span>{chainCurrent?.name}</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={chainCurrent?.logo}
            style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '5px' }}
          />
          <CaretDown size={18} />
        </span>
      </Button>
      <StyledMenu
        id="chain-menu"
        anchorEl={anchorEl}
        open={openMenu}
        onClose={onCloseMenu}
        MenuListProps={{
          'aria-labelledby': 'chain-button',
        }}
      >
        {otherChains.map(item => {
          return (
            <MenuItem
              key={item.chain_id}
              selected={chainCurrent?.chain_id === item.chain_id}
              onClick={() => onSelect(item.chain_id)}
            >
              <img src={item.logo} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              <span style={{ marginLeft: '15px' }}>{item.name}</span>
            </MenuItem>
          );
        })}
      </StyledMenu>
    </>
  );
}
