import React, { useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import { Box, Stack, Paper, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { downloadFile, formatFileSize } from '../utils/commons';
import { PlayCircle } from 'phosphor-react';
import { MediaType } from '../constants/commons-const';
import FileTypeBadge from './FileTypeBadge';
import ImageCanvas from './ImageCanvas';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import LightboxMedia from './LightboxMedia';

const QuiltedMediaList = ({ medias, setIsOpen, setIndexMedia }) => {
  const processedImages = medias.map((item, index) => {
    const totalImages = medias.length;

    if (totalImages === 1) return { ...item, cols: 1, rows: 1 }; // Full width
    if (totalImages === 2) return { ...item, cols: 1, rows: 1 }; // 2 ảnh chia 2 cột
    if (totalImages >= 3) {
      const position = index % 6; // Lặp lại logic theo nhóm 6 ảnh
      let cols;
      let rows;
      if (position === 0) {
        cols = 2;
        rows = 2;
      }
      if (position === 1 || position === 2) {
        cols = 1;
        rows = 1;
      }
      if (position === 3) {
        cols = 3;
        rows = 1;
      }
      if (position === 4) {
        cols = 2;
        rows = 1;
      }
      if (position === 5) {
        cols = 1;
        rows = 1;
      }

      return {
        ...item,
        cols,
        rows,
      };
    }
  });

  const columnCount = medias.length === 1 ? 1 : medias.length === 2 ? 2 : 3;

  if (medias.length === 0) return null;

  return (
    <ImageList variant="quilted" cols={columnCount} rowHeight={medias.length === 1 ? 'auto' : 180}>
      {processedImages.map((item, index) => (
        <ImageListItem key={index} cols={item.cols} rows={item.rows}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: '12px',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsOpen(true);
              setIndexMedia(index);
            }}
          >
            <ImageCanvas
              dataUrl={item.type === MediaType.VIDEO ? item.poster : item.src}
              width={'100%'}
              height={'100%'}
              styleCustom={{ borderRadius: '12px' }}
            />
            {item.type === MediaType.VIDEO && (
              <PlayCircle
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                size={40}
                weight="fill"
                color="#fff"
              />
            )}
          </Paper>
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default function Attachments({ attachments }) {
  const theme = useTheme();
  const [medias, setMedias] = useState([]);
  const [pdfData, setPdfData] = useState(null);
  const [indexMedia, setIndexMedia] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isMovFileTooLarge = file => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (!file || file.type !== 'video') return false;

    const isMov = file.mime_type === 'video/quicktime';
    const isTooLarge = file.file_size > MAX_SIZE;

    return isMov && isTooLarge;
  };

  const isAviFile = file => {
    if (!file || file.type !== 'video') return false;

    const isAvi = file.mime_type === 'video/x-msvideo';

    return isAvi;
  };

  const isThumbVideo = file => {
    if (!file || file.type !== 'video') return false;

    return file.thumb_url;
  };

  // Lọc các tệp đính kèm không phải là hình ảnh và thỏa một trong hai điều kiện:
  // 1. Là tệp AVI (kiểm tra bằng hàm isAviFile)
  // 2. Là tệp MOV nhưng có kích thước lớn hơn 10MB (kiểm tra bằng hàm isMovFileTooLarge)
  const attachmentsOther = attachments.filter(
    attachment =>
      attachment.type !== 'image' &&
      (isAviFile(attachment) ||
        // isMovFileTooLarge(attachment) ||
        !isThumbVideo(attachment)) &&
      attachment.mime_type !== 'application/pdf',
  );

  const attachmentsPDF = attachments.filter(item => item.type === 'file' && item.mime_type === 'application/pdf');

  useEffect(() => {
    // Lọc các tệp đính kèm là hình ảnh hoặc là video không phải tệp AVI và video MOV không vượt quá 10MB
    const attachmentsImageAndVideo = attachments.filter(
      attachment =>
        attachment.type === 'image' ||
        (!isAviFile(attachment) &&
          // !isMovFileTooLarge(attachment) &&
          isThumbVideo(attachment)),
    );
    if (attachmentsImageAndVideo.length > 0) {
      const newMedias = attachmentsImageAndVideo.map(item => {
        if (item.type === 'image') {
          return {
            type: MediaType.IMAGE,
            src: item.image_url,
            alt: item.title,
            description: item.title,
          };
        } else {
          return {
            type: MediaType.VIDEO,
            width: 1280,
            height: 720,
            poster: item.thumb_url,
            sources: [
              {
                src: item.asset_url,
                type: item.mime_type,
              },
            ],
            description: item.title,
          };
        }
      });

      setMedias(newMedias);
    } else {
      setMedias([]);
    }
  }, [attachments]);

  useEffect(() => {
    if (!isOpen) {
      setPdfData(null);
      setIndexMedia(0);
    }
  }, [isOpen]);

  const onViewPDF = item => {
    setPdfData({
      type: MediaType.PDF,
      src: item.asset_url,
      description: item.title,
    });
    setIsOpen(true);
    setIndexMedia(0);
  };

  const onDownloadFile = (url, fileName) => {
    downloadFile(url, fileName);
  };

  if (!attachments.length) return null;

  return (
    <Box sx={{ maxWidth: attachments.length === 1 ? '20rem' : '30rem' }}>
      <Stack direction="row" justifyContent="flex-end">
        <QuiltedMediaList medias={medias} setIsOpen={setIsOpen} setIndexMedia={setIndexMedia} />
      </Stack>

      <LightboxMedia
        openLightbox={isOpen}
        setOpenlightbox={setIsOpen}
        medias={pdfData ? [pdfData] : medias}
        indexMedia={indexMedia}
      />

      {attachmentsPDF.length > 0 && (
        <List>
          {attachmentsPDF.map((item, index) => {
            const lastItem = index === attachmentsPDF.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <Paper elevation={3} sx={{ borderRadius: '12px', width: '100%' }}>
                  <ListItemButton onClick={() => onViewPDF(item)}>
                    <FileTypeBadge fileName={item.title} />
                    <ListItemText
                      primary={item.title}
                      secondary={formatFileSize(item.file_size)}
                      sx={{
                        width: 'calc(100% - 50px)',
                        paddingLeft: '15px',
                      }}
                      primaryTypographyProps={{
                        whiteSpace: 'nowrap',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    />
                  </ListItemButton>
                </Paper>
              </ListItem>
            );
          })}
        </List>
      )}

      {attachmentsOther.length > 0 && (
        <List>
          {attachmentsOther.map((item, index) => {
            const lastItem = index === attachmentsOther.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <Paper elevation={3} sx={{ borderRadius: '12px', width: '100%' }}>
                  <ListItemButton onClick={() => onDownloadFile(item.asset_url, item.title)}>
                    <FileTypeBadge fileName={item.title} />
                    <ListItemText
                      primary={item.title}
                      secondary={formatFileSize(item.file_size)}
                      sx={{
                        width: 'calc(100% - 50px)',
                        paddingLeft: '15px',
                      }}
                      primaryTypographyProps={{
                        whiteSpace: 'nowrap',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    />
                  </ListItemButton>
                </Paper>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}
