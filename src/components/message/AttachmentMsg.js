import React from 'react';
import { Stack, Box, useTheme } from '@mui/material';
import Attachments from '../../components/Attachments';
import VoiceLine from './VoiceLine';
import TextLine from './TextLine';
import DateLine from './DateLine';
import ForwardTo from './ForwardTo';
import MessageOption from '../message/MessageOption';

const AttachmentMsg = ({ message, forwardChannelName }) => {
  if (!message) return null;

  const theme = useTheme();
  const attachments = message.attachments.filter(
    attachment => !['linkPreview', 'voiceRecording'].includes(attachment.type),
  );
  const voiceMsg = message.attachments.find(attachment => attachment.type === 'voiceRecording');
  const isEdited = message.updated_at;

  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} sx={{ width: '100%' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: message.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: attachments.length === 1 ? '20rem' : '30rem',
        }}
      >
        <Stack spacing={1}>
          <ForwardTo message={message} forwardChannelName={forwardChannelName} />
          <Attachments attachments={attachments} />
          <VoiceLine voiceMsg={voiceMsg} isMyMessage={message.isMyMessage} />
          {message.text ? (
            <>
              <TextLine message={message} />
            </>
          ) : (
            <DateLine
              date={isEdited ? message.updated_at : message.created_at}
              isEdited={isEdited}
              isMyMessage={message.isMyMessage}
            />
          )}
        </Stack>
        <MessageOption isMyMessage={message.isMyMessage} message={message} />
      </Box>
    </Stack>
  );
};
export default AttachmentMsg;
