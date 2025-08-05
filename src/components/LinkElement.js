import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { getDisplayDate } from '../utils/formatTime';
import ImageCanvas from './ImageCanvas';
import NoImage from '../assets/Images/no-image.png';

const StyledLinkItem = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  padding: '5px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
}));

const LinkElement = ({ link, size = 52, primaryFontSize = '14px', secondaryFontSize = '12px' }) => {
  const theme = useTheme();

  const onClickLink = link => {
    if (link.url) {
      window.open(link.url, '_blank');
    }
  };

  return (
    <StyledLinkItem onClick={() => onClickLink(link)}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
        <ImageCanvas
          dataUrl={link.thumb_url ? link.thumb_url : NoImage}
          width={size}
          height={size}
          styleCustom={{ borderRadius: '12px', objectFit: 'cover' }}
        />

        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
          {link.title && (
            <Typography
              variant="subtitle2"
              sx={{
                minWidth: 'auto',
                overflow: 'hidden',
                fontSize: primaryFontSize,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {link.title}
            </Typography>
          )}

          {link.url && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.info.main,
                fontSize: secondaryFontSize,
                fontWeight: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {link.url}
            </Typography>
          )}

          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ marginTop: '5px' }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              {link.user.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              {getDisplayDate(link.created_at)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </StyledLinkItem>
  );
};

export default LinkElement;
