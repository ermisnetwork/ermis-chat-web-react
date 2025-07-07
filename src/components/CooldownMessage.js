import React, { useEffect, useState } from 'react';
import { useTheme, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { SetCooldownTime } from '../redux/slices/channel';

export default function CooldownMessage({ cooldownTime }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const { duration, lastSend } = cooldownTime;

    const lastSendTimestamp = new Date(lastSend).getTime(); // convert lastSend from ISO to timestamp
    const remainingTime = duration - (Date.now() - lastSendTimestamp);

    if (remainingTime > 0) {
      setTimeLeft(remainingTime);
    } else {
      setTimeLeft(0);
      dispatch(SetCooldownTime(null));
    }

    const interval = setInterval(() => {
      const remainingTime = duration - (Date.now() - lastSendTimestamp);
      if (remainingTime > 0) {
        setTimeLeft(remainingTime);
      } else {
        setTimeLeft(0);
        clearInterval(interval); // Clear the interval when countdown ends
        dispatch(SetCooldownTime(null));
      }
    }, 100);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [cooldownTime, dispatch]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return (
    <Typography
      sx={{
        color: theme.palette.primary.main,
        width: '48px',
        height: '48px',
        fontSize: '14px',
        fontWeight: 700,
        lineHeight: '48px',
        textAlign: 'center',
      }}
    >
      {`${formattedMinutes}:${formattedSeconds}`}
    </Typography>
  );
}
