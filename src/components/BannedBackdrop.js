import { Box } from '@mui/material';

export default function BannedBackdrop() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
      }}
    >
      {/* <Box sx={{ position: 'absolute', width: '100%', height: '90px', top: 0, left: 0 }} />
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '80px',
          bottom: 0,
          left: 0,
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
        }}
      /> */}
    </Box>
  );
}
