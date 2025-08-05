import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { downloadFile, formatFileSize } from '../utils/commons';
import FileTypeBadge from './FileTypeBadge';
import { getDisplayDate } from '../utils/formatTime';

const StyledFileItem = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  padding: '5px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
}));

const FileElement = ({ file, size = 44, primaryFontSize = '14px', secondaryFontSize = '12px' }) => {
  const theme = useTheme();

  const onDownloadFile = url => {
    downloadFile(url, file.title);
  };

  return (
    <StyledFileItem onClick={() => onDownloadFile(file)}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
        <FileTypeBadge fileName={file.title} size={size} />

        <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" gap={1}>
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
              {file.title}
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: secondaryFontSize,
              fontWeight: 400,
            }}
          >
            {formatFileSize(file.file_size)}
          </Typography>
        </Stack>

        {file.created_at && (
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontSize: '10px', fontWeight: 500 }}>
            {getDisplayDate(file.created_at)}
          </Typography>
        )}
      </Stack>
    </StyledFileItem>
  );
};

export default FileElement;
