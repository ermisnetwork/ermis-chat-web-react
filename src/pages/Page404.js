import { Stack, Typography, Button, useTheme } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import NotFound404 from '../assets/Illustration/NotFound404';

const Page404 = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
      <NotFound404 />
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontSize: '32px', textAlign: 'center' }}>
          PAGE NOT FOUND!
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ fontSize: '18px', textAlign: 'center', color: theme.palette.text.secondary }}
        >
          Sorry, we couldn’t find the page you’re looking for. <br /> Perhaps you’ve mistyped the URL? Be sure to check
          your spelling.
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" sx={{ textTransform: 'none' }} onClick={() => navigate(`${DEFAULT_PATH}`)}>
            Go to Home
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Page404;
