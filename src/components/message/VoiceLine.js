import React from 'react';
import { Stack } from '@mui/material';
import CustomAudioPlayer from '../CustomAudioPlayer';

const VoiceLine = ({ voiceMsg, isMyMessage }) => {
  if (!voiceMsg) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={1} maxWidth={'100%'} width={'400px'}>
      <CustomAudioPlayer
        src={voiceMsg.asset_url}
        waveColor={isMyMessage ? '#fff' : '#0C0A29'}
        progressColor={isMyMessage ? '#0C0A29' : '#7949ec'}
      />
    </Stack>
  );

  // return <AudioPlayer src={voiceMsg.asset_url} />;
};

export default VoiceLine;