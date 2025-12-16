import { Box, Stack, useTheme } from '@mui/material';
import React from 'react';
import DateLine from './DateLine';
import PollBox from './PollBox';
import MessageOption from '../message/MessageOption';

const PollMsg = ({ message, all_members }) => {
  const theme = useTheme();

  const isEdited = message.updated_at;

  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: message.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '90%',
        }}
      >
        <PollBox message={message} all_members={all_members} />

        <DateLine date={isEdited ? message.updated_at : message.created_at} isEdited={isEdited} isMyMessage={message.isMyMessage} />
        <MessageOption isMyMessage={message.isMyMessage} message={message} />
      </Box>
    </Stack>
  );
};
export default PollMsg;