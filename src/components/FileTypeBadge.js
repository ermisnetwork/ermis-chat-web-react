import React from 'react';
import { Box, Typography } from '@mui/material';

const FileTypeBadge = ({ fileName }) => {
  // const parts = fileName.split('.');
  // const type = parts.length > 1 ? parts.pop().toUpperCase() : '';

  const type = fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase();

  const typeColors = {
    PDF: '#F44336',
    PNG: '#2196F3',
    JPG: '#FFEB3B',
    JPEG: '#FFEB3B',
    GIF: '#FF5722',
    SVG: '#4CAF50',
    WEBP: '#03A9F4',
    DOC: '#3F51B5',
    DOCX: '#3F51B5',
    XLS: '#4CAF50',
    XLSX: '#4CAF50',
    PPT: '#FF9800',
    PPTX: '#FF9800',
    TXT: '#9E9E9E',
    CSV: '#00BCD4',
    JSON: '#8BC34A',
    XML: '#673AB7',
    MP4: '#9C27B0',
    MOV: '#ffa07a',
    AVI: '#ffb6c1',
    MP3: '#E91E63',
    WAV: '#795548',
    FLAC: '#009688',
    ZIP: '#607D8B',
    RAR: '#FF5722',
    TAR: '#FF9800',
    GZ: '#FF9800',
    EXE: '#DD2C00',
    MSI: '#D84315',
    DMG: '#37474F',
    ISO: '#757575',
    BIN: '#616161',
    APK: '#43A047',
    IPA: '#009688',
    HTML: '#FF6F00',
    CSS: '#039BE5',
    JS: '#FFD600',
    TS: '#0277BD',
    JAVA: '#795548',
    PY: '#FFB74D',
    C: '#0288D1',
    CPP: '#5D4037',
    PHP: '#7E57C2',
    DEFAULT: '#BDBDBD',
  };

  return (
    <Box
      className="fileIcon"
      sx={{
        width: 50,
        height: 50,
        backgroundColor: typeColors[type] || typeColors.DEFAULT,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: '12px',
          fontWeight: 700,
          padding: '0 3px',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {type || ''}
      </Typography>
    </Box>
  );
};

export default FileTypeBadge;
