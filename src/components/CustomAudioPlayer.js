import { IconButton, Stack, useTheme } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Iconify from './Iconify';

const CustomAudioPlayer = ({ src, waveColor = '#fff', progressColor = '#0C0A29', onLoaded }) => {
  const theme = useTheme();
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (waveformRef.current && src) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: waveColor,
        progressColor: progressColor,
        barWidth: 3,
        barGap: 3,
        barRadius: 10,
        height: 38,
        // barHeight: 32,
        dragToSeek: false,
        interact: false,
        hideScrollbar: true,
      });
      wavesurfer.current.load(src);

      wavesurfer.current.on('ready', () => {
        const duration = wavesurfer.current.getDuration();
        setDuration(duration);
        const waveform_data_arr = wavesurfer.current.exportPeaks({ maxLength: 100 }) || [];

        if (onLoaded) {
          onLoaded({ duration, waveform_data: waveform_data_arr[0] || [] });
        }
      });

      wavesurfer.current.on('audioprocess', () => {
        setCurrent(wavesurfer.current.getCurrentTime());
      });

      wavesurfer.current.on('seek', () => {
        setCurrent(wavesurfer.current.getCurrentTime());
      });

      wavesurfer.current.on('finish', () => {
        setPlaying(false);
        setCurrent(duration);
      });

      return () => {
        wavesurfer.current.destroy();
      };
    }
  }, [src]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setPlaying(!playing);
    }
  };

  const formatTime = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1} width={'100%'} sx={{ padding: '0px 10px' }}>
      <IconButton onClick={togglePlay}>
        <Iconify icon={playing ? 'solar:pause-bold' : 'solar:play-bold'} color={waveColor} size={18} />
      </IconButton>
      <div ref={waveformRef} style={{ flex: 1, minWidth: 0 }} />
      <span style={{ color: waveColor, fontSize: 14 }}>{formatTime(duration - current)}</span>
    </Stack>
  );
};

export default CustomAudioPlayer;
