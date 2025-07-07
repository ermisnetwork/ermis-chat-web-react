import React from 'react';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { useTheme } from '@emotion/react';

function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name) {
  return {
    children: `${name.substring(0, 2)}`,
  };
}

export default function ProjectAvatar({ project, width, height }) {
  const theme = useTheme();

  const getFontSizeAvatar = size => {
    return `${size / 2.5}px`;
  };

  return (
    <Stack direction="row" spacing={2}>
      <Avatar
        // alt={capitalizeFirstLetter(project.project_name)}
        src={project.image ? project.image : project.project_name}
        sx={{
          background: stringToColor(project.project_name),
          color: '#fff',
          width: width,
          height: height,
          border: `1px solid ${theme.palette.background.paper}`,
          fontSize: getFontSizeAvatar(width),
          fontWeight: 600,
        }}
        {...stringAvatar(project.project_name)}
      />
    </Stack>
  );
}
