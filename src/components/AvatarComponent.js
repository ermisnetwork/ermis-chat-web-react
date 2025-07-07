import * as React from 'react';
import Stack from '@mui/material/Stack';
import { GlobeHemisphereWest } from 'phosphor-react';
import ImageCanvas from './ImageCanvas';
import AvatarDefault from './AvatarDefault';
import { useTheme } from '@mui/material';

export default function AvatarComponent({ name = '', url = '', width, height, isPublic = false, openLightbox }) {
  const theme = useTheme();
  const renderIconPublic = () => {
    if (isPublic) {
      return (
        <GlobeHemisphereWest
          weight="fill"
          size={width / 2.5}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 1,
            margin: 0,
            color: '#4A90E2',
          }}
        />
      );
    }
    return null;
  };

  return (
    <Stack direction="row" sx={{ position: 'relative' }}>
      {url ? (
        <ImageCanvas
          dataUrl={url}
          width={width}
          height={height}
          styleCustom={{
            borderRadius: '30%',
            border: `1px solid ${theme.palette.background.paper}`,
          }}
          openLightbox={openLightbox}
        />
      ) : (
        <AvatarDefault name={name} width={width} height={height} />
      )}
      {renderIconPublic()}
    </Stack>
  );
}
