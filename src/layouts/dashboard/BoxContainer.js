import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';

const BoxContainer = ({ children }) => {
  const theme = useTheme();
  const isMobileToMd = useResponsive('down', 'md');

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: isMobileToMd ? 'fixed' : 'relative',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        borderRadius: '16px',
        minWidth: 'auto',
        flex: 1,
        top: isMobileToMd ? 0 : undefined,
        left: isMobileToMd ? 0 : undefined,
        right: isMobileToMd ? 0 : undefined,
        bottom: isMobileToMd ? 0 : undefined,
        zIndex: isMobileToMd ? 10 : 5,
        marginLeft: isMobileToMd ? '0px !important' : '16px !important',
      }}
    >
      {children}
    </Box>
  );
};

export default BoxContainer;
