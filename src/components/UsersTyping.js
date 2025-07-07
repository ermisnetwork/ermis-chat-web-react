import React from 'react';
import { Box, useTheme } from '@mui/material';

const UsersTyping = ({ usersTyping }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        padding: '0px 24px',
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.background.default,
        position: 'absolute',
        top: '-10px',
        zIndex: 1,
        borderRadius: '30px',
      }}
    >
      <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
        {usersTyping.length === 1
          ? `${usersTyping[0].name} is typing`
          : usersTyping.length === 2
            ? `${usersTyping[0].name} and 1 other are typing`
            : `${usersTyping[0].name} and ${usersTyping.length - 1} other are typing`}
        &nbsp;&nbsp;
        <div className="loader">
          <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
          <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
          <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
        </div>
      </div>
    </Box>
  );
};

export default UsersTyping;
