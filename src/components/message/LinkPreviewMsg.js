import React from 'react';
import { 
    Stack, 
    Box,
    useTheme, 
} from '@mui/material';
import LinkPreview from '../LinkPreview';
import TextLine from './TextLine';
import ForwardTo from './ForwardTo';
import MessageOption from '../message/MessageOption';

const LinkPreviewMsg = ({ message, forwardChannelName }) => {
  const theme = useTheme();
  const linkPreview = message.attachments[0]; // chỉ hiển thị linkPreview đầu tiên

  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} sx={{ width: '100%' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: message.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '400px',
        }}
      >
        <Stack spacing={1}>
          <ForwardTo message={message} forwardChannelName={forwardChannelName} />
          <LinkPreview linkPreview={linkPreview} />

          {message.text && (
            <>
              <TextLine message={message} />
            </>
          )}
        </Stack>
        <MessageOption isMyMessage={message.isMyMessage} message={message} />
      </Box>
    </Stack>
  );
};
export default LinkPreviewMsg;