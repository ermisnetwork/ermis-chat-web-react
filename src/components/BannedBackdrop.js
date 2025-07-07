import React, { useEffect, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { ClientEvents } from '../constants/events-const';

export default function BannedBackdrop() {
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      const membership = currentChannel.state.membership;
      const banned = membership?.banned ?? false;
      setIsBanned(banned);

      const handleMemberBanned = event => {
        if (event.member.user_id === user_id) {
          setIsBanned(event.member.banned);
        }
      };

      const handleMemberUnBanned = event => {
        if (event.member.user_id === user_id) {
          setIsBanned(event.member.banned);
        }
      };

      currentChannel.on(ClientEvents.MemberBanned, handleMemberBanned);
      currentChannel.on(ClientEvents.MemberUnBanned, handleMemberUnBanned);

      return () => {
        currentChannel.off(ClientEvents.MemberBanned, handleMemberBanned);
        currentChannel.off(ClientEvents.MemberUnBanned, handleMemberUnBanned);
      };
    }
  }, [currentChannel, user_id]);

  if (!isBanned) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
      }}
    >
      <Box sx={{ position: 'absolute', width: '100%', height: '90px', top: 0, left: 0 }} />
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '80px',
          bottom: 0,
          left: 0,
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
        }}
      />
    </Box>
  );
}
