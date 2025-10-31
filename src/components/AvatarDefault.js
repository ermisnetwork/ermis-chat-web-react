import React, { useMemo, useCallback } from 'react';
import { useTheme } from '@mui/material';
import { User } from 'phosphor-react';
import PropTypes from 'prop-types';

import { AvatarShape } from '../constants/commons-const';
import getColorName from '../utils/getColorName';
import capitalizeFirstLetter from '../utils/commons';
import { TRANSITION } from '../config';

const AvatarDefault = ({ name = '', width, height, shape = AvatarShape.Circle }) => {
  const theme = useTheme();

  const getFontSizeAvatar = useCallback(size => `${size / 2}px`, []);

  const computedValues = useMemo(
    () => ({
      backgroundColor: getColorName(name),
      fontSize: getFontSizeAvatar(width),
      borderRadius: shape === AvatarShape.Circle ? '50%' : '25%',
      iconSize: width / 2,
    }),
    [name, width, shape, getFontSizeAvatar],
  );

  const avatarStyle = useMemo(
    () => ({
      background: computedValues.backgroundColor,
      color: '#fff',
      width,
      height,
      border: `1px solid ${theme.palette.background.paper}`,
      fontSize: computedValues.fontSize,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: computedValues.borderRadius,
      fontWeight: 700,
      transition: TRANSITION,
    }),
    [
      computedValues.backgroundColor,
      computedValues.fontSize,
      computedValues.borderRadius,
      width,
      height,
      theme.palette.background.paper,
    ],
  );

  const renderContent = useMemo(() => {
    return name ? capitalizeFirstLetter(name) : <User size={computedValues.iconSize} color="#fff" weight="fill" />;
  }, [name, computedValues.iconSize]);

  const ariaLabel = useMemo(() => {
    return name ? `Avatar for ${name}` : 'Default user avatar';
  }, [name]);

  return (
    <span style={avatarStyle} role="img" aria-label={ariaLabel} title={ariaLabel}>
      {renderContent}
    </span>
  );
};

// PropTypes validation
AvatarDefault.propTypes = {
  name: PropTypes.string,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  shape: PropTypes.oneOf([AvatarShape.Circle, AvatarShape.Round]),
};

export default AvatarDefault;
