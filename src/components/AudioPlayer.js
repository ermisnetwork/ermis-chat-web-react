import React, { useRef, useState } from 'react';
import { Card, IconButton, Slider, Typography } from '@mui/material';
import { PauseCircle, PlayCircle } from 'phosphor-react';

const formatTime = time => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.currentTime >= duration) {
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (event, newValue) => {
    const seekTime = (newValue / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  return (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 2, width: '400px' }}>
      <IconButton onClick={togglePlay} color="primary">
        {isPlaying ? <PauseCircle /> : <PlayCircle />}
      </IconButton>
      <Typography variant="body2">{formatTime(currentTime)}</Typography>
      <Slider
        value={(currentTime / duration) * 100 || 0}
        onChange={handleSeek}
        aria-labelledby="audio-slider"
        sx={{ flex: 1 }}
      />
      <Typography variant="body2">{formatTime(duration)}</Typography>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} />
    </Card>
  );
};

export default AudioPlayer;
