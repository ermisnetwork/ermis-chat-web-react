import { Box, useTheme } from '@mui/material';
import ImageCanvas from './ImageCanvas';
import { AvatarShape } from '../constants/commons-const';
import AvatarDefault from './AvatarDefault';
import { TRANSITION } from '../config';

const TopicAvatar = ({ url = '', name = '', size = 40, shape = 'circle', openLightbox = false }) => {
  const theme = useTheme();

  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  const styleCustom = {
    borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
    border: `1px solid ${theme.palette.background.paper}`,
  };

  if (!url) {
    return <AvatarDefault name={name} width={size} height={size} shape={shape} />;
  }

  // Kiểm tra url có phải emoji không
  if (url && url.startsWith('emoji://')) {
    const emoji = url.replace('emoji://', '');
    return (
      <Box
        sx={{
          // width: size,
          // height: size,
          lineHeight: `${size}px`,
          fontSize: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: TRANSITION,
        }}
      >
        {emoji}
      </Box>
    );
  }

  return <ImageCanvas dataUrl={url} width={size} height={size} styleCustom={styleCustom} openLightbox={openLightbox} />;
};

export default TopicAvatar;
