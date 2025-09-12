import React, { useEffect } from 'react';
import { Box, useTheme, Drawer } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';
import { WIDTH_SIDEBAR_PANEL } from '../../config';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebar, ToggleSidebar } from '../../redux/slices/app';
import { SidebarType } from '../../constants/commons-const';

const SidebarPanel = ({ children }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { sideBar } = useSelector(state => state.app);
  const isMobileToLg = useResponsive('down', 'lg');
  const isScreenLgToXl = useResponsive('between', null, 'lg', 'xl');

  const drawerWidth = 330;

  useEffect(() => {
    return () => {
      // Cleanup if necessary
      dispatch(setSidebar({ type: SidebarType.Channel, open: false, mode: '' })); // Reset sidebar state on unmount
    };
  }, []);

  if (isMobileToLg) {
    return (
      <Drawer
        anchor="right"
        open={sideBar.open}
        onClose={() => {
          dispatch(ToggleSidebar());
        }}
        PaperProps={{
          sx: {
            width: drawerWidth,
            backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: isScreenLgToXl ? '300px' : `${WIDTH_SIDEBAR_PANEL}px`,
        height: '100%',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        borderRadius: '16px',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
};

export default SidebarPanel;
