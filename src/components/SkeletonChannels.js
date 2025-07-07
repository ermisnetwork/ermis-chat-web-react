import React from 'react';
import { useTheme } from '@emotion/react';
import { Stack, Skeleton, Box } from '@mui/material';

export default function SkeletonChannels() {
  const theme = useTheme();

  return (
    <>
      <Stack
        direction="row"
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '50%' }} />
        <Box sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}>
          <Skeleton height={15} width="90%" />
          <Skeleton height={15} width="45%" />
        </Box>
      </Stack>

      <Stack
        direction="row"
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '50%' }} />
        <Box sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}>
          <Skeleton height={15} width="90%" />
          <Skeleton height={15} width="45%" />
        </Box>
      </Stack>
    </>
  );
}
