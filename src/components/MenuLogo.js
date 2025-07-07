import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@emotion/react';
import { Menu, MenuItem, Box, styled } from '@mui/material';
import { CaretRight } from 'phosphor-react';
import Logo from '../assets/Images/logo.svg';
import LogoSdk from '../assets/Images/logo-sdk.webp';
import { CHAIN_ID, PLATFORMS, PlatformType } from '../constants/wallet-const';
import { SetChainCurrent, SetProjectCurrent } from '../redux/slices/wallet';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import { isStagingDomain } from '../utils/commons';

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: '100px',
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
    borderRadius: '8px',
  },
}));

export default function MenuLogo() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chains, chainCurrent } = useSelector(state => state.wallet);

  const [anchorEl, setAnchorEl] = useState(null);
  const [platformId, setPlatformId] = useState(null);
  const isShowMenu = chains.length > 1 && isStagingDomain(); // chỉ hiển thị menu khi user đã tham gia thêm các chain khác

  useEffect(() => {
    if (chainCurrent) {
      if (chainCurrent?.chain_id === CHAIN_ID.Ermis) {
        setPlatformId(PlatformType.Ermis);
      } else {
        setPlatformId(PlatformType.Sdk);
      }
    } else {
      setPlatformId(null);
    }
  }, [chainCurrent]);

  const onOpenMenu = event => {
    if (isShowMenu) {
      setAnchorEl(event.currentTarget);
    }
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
  };

  const onSelect = value => {
    if (isShowMenu) {
      if (value === PlatformType.Ermis) {
        const chainErmis = chains.find(item => item.chain_id === CHAIN_ID.Ermis);
        dispatch(SetChainCurrent(chainErmis));
        // dispatch(SetProjectCurrent(chainErmis.your_projects[0].projects[0]));
      } else {
        const otherChains = chains.filter(item => item.chain_id !== CHAIN_ID.Ermis);
        dispatch(SetChainCurrent(otherChains[0]));
        dispatch(SetProjectCurrent(null));
      }

      setPlatformId(value);
      onCloseMenu();
      navigate(`${DEFAULT_PATH}`);
    }
  };

  const renderLogo = () => {
    if (platformId && isStagingDomain()) {
      if (platformId === PlatformType.Ermis) {
        return <img src={Logo} alt="logo" />;
      } else {
        return <img src={LogoSdk} alt="logo" />;
      }
    } else {
      return <img src={Logo} alt="logo" />;
    }
  };

  const openMenu = Boolean(anchorEl);

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={onOpenMenu}
      >
        <Box
          sx={{
            width: '50px',
            height: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            // backgroundColor: '#f1f1f1',
            // borderRadius: '6px',
            // padding: '4px',
          }}
        >
          {renderLogo()}
        </Box>

        {isShowMenu && (
          <Box sx={{ position: 'absolute', right: 0, display: 'flex' }}>
            <CaretRight size={20} />
          </Box>
        )}
      </Box>
      <StyledMenu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={onCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {PLATFORMS.map(item => {
          return (
            <MenuItem key={item.value} selected={platformId === item.value} onClick={() => onSelect(item.value)}>
              <img src={item.logo} style={{ width: '24px', height: '24px' }} />
              <span style={{ marginLeft: '15px' }}>{item.label}</span>
            </MenuItem>
          );
        })}
      </StyledMenu>
    </>
  );
}
