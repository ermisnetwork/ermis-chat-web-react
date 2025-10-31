import { alpha, Box, useTheme } from '@mui/material';
import React from 'react';
import { LoadingSpinner } from './animate';

const LoadingScreen = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        margin: '0px !important',
      }}
    >
      <LoadingSpinner />
    </Box>
  );
};

export default LoadingScreen;
