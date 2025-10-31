import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import { Stack } from '@mui/material';
import { GlobeHemisphereWest } from 'phosphor-react';
import PropTypes from 'prop-types';

import { AvatarShape } from '../constants/commons-const';
import AvatarDefault from './AvatarDefault';
import ImageCanvas from './ImageCanvas';

// Constants
const PUBLIC_ICON_COLOR = '#4A90E2';
const ICON_SIZE_RATIO = 2.5;

const AvatarComponent = ({
  name = '',
  url = '',
  width,
  height,
  isPublic = false,
  openLightbox,
  shape = AvatarShape.Circle,
}) => {
  const theme = useTheme();

  // Memoized computed values
  const computedValues = useMemo(
    () => ({
      borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
      iconSize: width / ICON_SIZE_RATIO,
    }),
    [shape, width],
  );

  // Memoized custom style for ImageCanvas
  const imageStyle = useMemo(
    () => ({
      borderRadius: computedValues.borderRadius,
      border: `1px solid ${theme.palette.background.paper}`,
    }),
    [computedValues.borderRadius, theme.palette.background.paper],
  );

  // Memoized icon style
  const iconStyle = useMemo(
    () => ({
      position: 'absolute',
      bottom: 0,
      right: 0,
      zIndex: 1,
      margin: 0,
      color: PUBLIC_ICON_COLOR,
    }),
    [],
  );

  // Memoized public icon
  const publicIcon = useMemo(() => {
    if (!isPublic) return null;

    return (
      <GlobeHemisphereWest weight="fill" size={computedValues.iconSize} style={iconStyle} aria-label="Public channel" />
    );
  }, [isPublic, computedValues.iconSize, iconStyle]);

  // Memoized avatar content
  const avatarContent = useMemo(() => {
    return url ? (
      <ImageCanvas dataUrl={url} width={width} height={height} styleCustom={imageStyle} openLightbox={openLightbox} />
    ) : (
      <AvatarDefault name={name} width={width} height={height} shape={shape} />
    );
  }, [url, width, height, imageStyle, openLightbox, name, shape]);

  return (
    <Stack
      direction="row"
      sx={{ position: 'relative' }}
      role="img"
      aria-label={`Avatar for ${name || 'user'}${isPublic ? ' (public)' : ''}`}
    >
      {avatarContent}
      {publicIcon}
    </Stack>
  );
};

// PropTypes validation
AvatarComponent.propTypes = {
  name: PropTypes.string,
  url: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  isPublic: PropTypes.bool,
  openLightbox: PropTypes.bool,
  shape: PropTypes.oneOf([AvatarShape.Circle, AvatarShape.Round]),
};

export default AvatarComponent;
