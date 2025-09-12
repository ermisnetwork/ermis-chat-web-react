import { Box, Typography } from '@mui/material';
import { ChatPurpleIcon } from './Icons';

const AvatarGeneralDefault = ({ size = 40 }) => {
  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <ChatPurpleIcon size={size} />
      <Typography variant="body1" sx={{ fontSize: getFontSizeAvatar(size), fontWeight: 600, color: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        G
      </Typography>
    </Box>
  );
};

export default AvatarGeneralDefault;
