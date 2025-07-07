import React from 'react';
import getColorName from '../utils/getColorName';
import capitalizeFirstLetter from '../utils/commons';
import { useTheme } from '@mui/material';
import { User } from 'phosphor-react';
import { AvatarShape } from '../constants/commons-const';

const AvatarDefault = ({ name, width, height, shape }) => {
  const theme = useTheme();

  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  return (
    <span
      style={{
        background: getColorName(name),
        color: '#fff',
        width: width,
        height: height,
        border: `1px solid ${theme.palette.background.paper}`,
        fontSize: getFontSizeAvatar(width),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: shape === AvatarShape.Circle ? '50%' : '30%',
        fontWeight: 700,
      }}
    >
      {name ? capitalizeFirstLetter(name) : <User size={width / 2} color="#fff" weight="fill" />}
    </span>
  );
};

export default AvatarDefault;
