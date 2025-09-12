import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Box,
  Stack,
  Typography,
  IconButton,
  useTheme,
  Grid,
  Skeleton,
  Chip,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { onFilesMessage, onSetAttachmentsMessage } from '../../redux/slices/messages';
import { Trash, X } from 'phosphor-react';
import { UploadType } from '../../constants/commons-const';
import { formatFileSize, processImageFile } from '../../utils/commons';
import FileTypeBadge from '../../components/FileTypeBadge';
import { ChatFooter } from '../../components/Chat';
import ImageCanvas from '../../components/ImageCanvas';

const MAX_SIZE_MB = 100; // Giới hạn 100MB

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const VideoPlayer = ({ attachment }) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    const handleMetadataLoaded = event => {
      if (video.duration === Infinity || isNaN(Number(video.duration))) {
        setDuration('');
      } else {
        setDuration(formatTime(Math.floor(video.duration)));
      }
    };

    if (video) {
      video.addEventListener('loadedmetadata', handleMetadataLoaded);
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleMetadataLoaded);
      }
    };
  }, [attachment]);

  return (
    <>
      {duration && (
        <Typography
          position="absolute"
          top={8}
          left={8}
          bgcolor="rgba(0, 0, 0, 0.5)"
          color="white"
          px={1}
          py={0.5}
          borderRadius={12}
          fontSize={12}
        >
          {duration}
        </Typography>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        width="100%"
        height="180"
        style={{ objectFit: 'cover', borderRadius: '8px' }}
        src={attachment.url}
      />
    </>
  );
};

const UploadFilesDialog = ({ setMessages }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { openDialog, files, uploadType } = useSelector(state => state.messages.filesMessage);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const [attachments, setAttachments] = useState([]);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  useEffect(() => {
    if (currentChat && files.length) {
      const getThumbUrlVideo = async thumbBlob => {
        const response = await currentChat.sendFile(thumbBlob);
        if (response) {
          return response.file;
        } else {
          return '';
        }
      };

      const checkFileTooLarge = size => {
        const fileSizeMB = size / (1024 * 1024); // Chuyển đổi sang MB
        return fileSizeMB > MAX_SIZE_MB;
      };

      // const filesArr = files.map(file => {
      //   const data = {
      //     loading: true,
      //     type: '',
      //     name: '',
      //     size: '',
      //     error: false,
      //     url: '',
      //     message: '',
      //   };
      //   return data;
      // });

      // setAttachments(filesArr);

      const onProcessFiles = async () => {
        const processedFiles = await Promise.all(files.map(file => processImageFile(file, false)));
        if (processedFiles) {
          const filesArr = processedFiles.map(file => {
            const isFileTooLarge = checkFileTooLarge(file.size);

            const data = {
              loading: !isFileTooLarge,
              type: file.type,
              name: file.name,
              size: file.size,
              error: isFileTooLarge,
              url: '',
              message: isFileTooLarge ? 'File size exceeds the limit. Maximum allowed: 100MB' : '',
            };
            return data;
          });

          setAttachments(filesArr);

          processedFiles.forEach(async file => {
            try {
              const isFileTooLarge = checkFileTooLarge(file.size);

              if (!isFileTooLarge) {
                let thumb_url = '';
                if (['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
                  const thumbBlob = await currentChat.getThumbBlobVideo(file);
                  if (thumbBlob) {
                    thumb_url = await getThumbUrlVideo(thumbBlob);
                  } else {
                    thumb_url = '';
                  }
                } else {
                  thumb_url = '';
                }

                const response = await currentChat.sendFile(file);

                if (response) {
                  setAttachments(prev => {
                    return prev.map(item => {
                      if (item.name === file.name) {
                        return {
                          ...item,
                          loading: false,
                          url: response.file,
                          thumb_url,
                        };
                      }
                      return item;
                    });
                  });
                }
              }
            } catch (error) {
              setAttachments(prev => {
                return prev.map(item => {
                  if (item.name === file.name) {
                    return {
                      ...item,
                      loading: false,
                      error: true,
                      message: 'Upload failed. Please try again',
                    };
                  }
                  return item;
                });
              });
            }
          });
        }
      };

      onProcessFiles();
    }
  }, [files, currentChat]);

  useEffect(() => {
    dispatch(onSetAttachmentsMessage(attachments.filter(item => !item.error)));
  }, [attachments]);

  const onCloseDialog = () => {
    dispatch(onFilesMessage({ openDialog: false, files: [], uploadType: '' }));
    dispatch(onSetAttachmentsMessage([]));
    setAttachments([]);
  };

  const renderErrorAttachment = attachment => {
    const isPhotoOrVideo = uploadType === UploadType.PhotoOrVideo && attachments.length > 1;
    return (
      <Stack
        direction={isPhotoOrVideo ? 'column' : 'row'}
        sx={{
          border: `1px solid ${theme.palette.error.main}`,
          borderRadius: '8px',
          padding: '5px',
          height: isPhotoOrVideo ? '180px' : 'auto',
        }}
      >
        <Box sx={{ display: 'inline-flex', margin: isPhotoOrVideo ? '0 auto 15px' : 0 }}>
          <FileTypeBadge fileName={attachment.name} />
        </Box>

        <Box
          sx={{ width: 'calc(100% - 50px)', padding: isPhotoOrVideo ? '0 0 40px 0' : '0 50px 0 15px', lineHeight: 1 }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {attachment.name}
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, display: 'block' }} variant="caption">
            {formatFileSize(attachment.size)}
          </Typography>
          <Typography sx={{ color: theme.palette.error.main }} variant="caption">
            {attachment.message}
          </Typography>
        </Box>
      </Stack>
    );
  };

  const renderTitle = () => {
    const getTitleByMimeType = attachments => {
      if (!attachments?.length) return 'Sent file';

      const counts = { image: 0, video: 0, file: 0 };

      attachments.forEach(file => {
        const mimeType = file.type;
        if (mimeType.startsWith('image/')) counts.image++;
        else if (mimeType.startsWith('video/')) counts.video++;
        else counts.file++;
      });

      const { image, video, file } = counts;

      if (image === 1 && !video && !file) return 'Sent an photo';
      if (video === 1 && !image && !file) return 'Sent a video';
      if (image && video && !file) return `Sent ${image + video} photos and videos`;
      if (image && !video && !file) return `Sent ${image} photos`;
      if (video && !image && !file) return `Sent ${video} videos`;

      return `Sent ${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}`;
    };

    return getTitleByMimeType(attachments.filter(item => !item.error));
  };

  const renderAttachment = attachment => {
    if (uploadType === UploadType.PhotoOrVideo) {
      if (attachment.type.startsWith('video/')) {
        if (!attachment.thumb_url) {
          return (
            <Stack
              direction="row"
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                padding: '15px',
                height: '180px',
              }}
            >
              <FileTypeBadge fileName={attachment.name} />

              <Box sx={{ width: 'calc(100% - 50px)', padding: '0 50px 0 15px', lineHeight: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingRight: '50px',
                  }}
                >
                  {attachment.name}
                </Typography>
                <Typography sx={{ color: theme.palette.text.secondary }} variant="caption">
                  {formatFileSize(attachment.size)}
                </Typography>
              </Box>
            </Stack>
          );
        }
        return <VideoPlayer attachment={attachment} />;
      } else {
        return (
          <ImageCanvas dataUrl={attachment.url} width={'100%'} height={'180px'} styleCustom={{ borderRadius: '8px' }} />
        );
      }
    } else {
      return (
        <Stack direction="row">
          {attachment.type.startsWith('image/') ? (
            <ImageCanvas
              dataUrl={attachment.url}
              width={'50px'}
              height={'50px'}
              styleCustom={{ borderRadius: '8px' }}
            />
          ) : (
            <FileTypeBadge fileName={attachment.name} />
          )}

          <Box sx={{ width: 'calc(100% - 50px)', padding: '0 50px 0 15px', lineHeight: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '50px',
              }}
            >
              {attachment.name}
            </Typography>
            <Typography sx={{ color: theme.palette.text.secondary }} variant="caption">
              {formatFileSize(attachment.size)}
            </Typography>
          </Box>
        </Stack>
      );
    }
  };

  const renderSkeleton = () => {
    if (uploadType === UploadType.PhotoOrVideo) {
      return <Skeleton variant="rounded" width="100%" height={180} />;
    } else {
      return (
        <Stack direction="row">
          <Skeleton variant="rounded" width={50} height={50} />
          <Box sx={{ width: 'calc(100% - 50px)', paddingLeft: '15px' }}>
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="40%" />
          </Box>
        </Stack>
      );
    }
  };

  const onRemoveAttachment = index => {
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(updatedAttachments);
    if (updatedAttachments.length === 0) {
      onCloseDialog();
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      // onClose={onCloseDialog}
    >
      <DialogTitle sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {renderTitle()}
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ maxHeight: '376px', overflowY: 'auto' }} className="customScrollbar">
          <Grid container rowSpacing={1} columnSpacing={1}>
            {attachments.map((attachment, index) => {
              const colSpan = attachments.length === 1 ? 12 : uploadType === UploadType.PhotoOrVideo ? 6 : 12;
              return (
                <Grid key={index} item xs={colSpan}>
                  <Stack sx={{ position: 'relative' }}>
                    {attachment.loading
                      ? renderSkeleton()
                      : attachment.error
                        ? renderErrorAttachment(attachment)
                        : renderAttachment(attachment)}

                    <Chip
                      label={<Trash size={18} color="#fff" style={{ display: 'block' }} />}
                      onClick={() => onRemoveAttachment(index)}
                      sx={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    />
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        <Box sx={{ marginTop: '24px' }}>
          <ChatFooter setMessages={setMessages} isDialog={true} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFilesDialog;
