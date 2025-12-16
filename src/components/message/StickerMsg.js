import { Box, Stack, useTheme } from '@mui/material';
import React from 'react';
import DateLine from './DateLine';
import ForwardTo from './ForwardTo';
import ImageCanvas from '../ImageCanvas';
import MessageOption from '../message/MessageOption';

const StickerMsg = ({ message, forwardChannelName }) => {
  const theme = useTheme();
  const isEdited = message.updated_at;
  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        py={1.5}
        sx={{
          position: 'relative',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: message.isMyMessage ? 'flex-end' : 'flex-start',
        }}
      >
        <ForwardTo message={message} forwardChannelName={forwardChannelName} />
        <Stack direction="column" alignItems="flex-end" width={'200px'} justifyContent="center">
          {message.sticker_url.endsWith('.tgs') ? (
            <tgs-player
              autoplay
              loop
              mode="normal"
              src={message.sticker_url}
              style={{ width: '200px', height: '200px' }}
            ></tgs-player>
          ) : (
            <ImageCanvas
              dataUrl={message.sticker_url}
              width={'200px'}
              height={'200px'}
              styleCustom={{ borderRadius: '12px' }}
              openLightbox={true}
            />
          )}

          <DateLine date={isEdited ? message.updated_at : message.created_at} isMyMessage={message.isMyMessage} />
        </Stack>

        <MessageOption isMyMessage={message.isMyMessage} message={message} />
      </Box>
    </Stack>
  );
};
export default StickerMsg;