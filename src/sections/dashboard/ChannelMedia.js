import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Tabs,
  Tab,
  Grid,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
} from '@mui/material';
import { ArrowLeft, PlayCircle } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType } from '../../redux/slices/app';
import { MediaType, SidebarType } from '../../constants/commons-const';
import { downloadFile, formatFileSize } from '../../utils/commons';
import FileTypeBadge from '../../components/FileTypeBadge';
import ImageCanvas from '../../components/ImageCanvas';
import NoImage from '../../assets/Images/no-image.png';
import LightboxMedia from '../../components/LightboxMedia';

const LIST_TAB = [
  { value: 0, label: 'Media' },
  { value: 1, label: 'Files' },
  { value: 2, label: 'Links' },
];

const MediasBox = ({ medias }) => {
  const theme = useTheme();
  const [isOpenLightBox, setIsOpenLightBox] = useState(false);
  const [indexMedia, setIndexMedia] = useState(0);

  return (
    <>
      {medias.length > 0 ? (
        <Grid container sx={{ width: '100%' }} spacing={1}>
          {medias.map((item, index) => {
            const isVideo = item.type === MediaType.VIDEO;

            return (
              <Grid
                key={index}
                item
                xs={4}
                sx={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => {
                  setIsOpenLightBox(true);
                  setIndexMedia(index);
                }}
              >
                <ImageCanvas
                  dataUrl={isVideo ? item.poster : item.src}
                  width={'100%'}
                  height={'96px'}
                  styleCustom={{ borderRadius: '6px' }}
                />
                {isVideo && (
                  <PlayCircle
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    size={30}
                    weight="fill"
                    color="#fff"
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          No medias
        </Typography>
      )}
      <LightboxMedia
        openLightbox={isOpenLightBox}
        setOpenlightbox={setIsOpenLightBox}
        medias={medias}
        indexMedia={indexMedia}
      />
    </>
  );
};

const FilesBox = ({ files }) => {
  const theme = useTheme();

  return (
    <>
      {files.length > 0 ? (
        <List>
          {files.map((item, index) => {
            const lastItem = index === files.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <Paper elevation={3} sx={{ borderRadius: '12px', width: '100%' }}>
                  <ListItemButton onClick={() => downloadFile(item.url, item.file_name)}>
                    <FileTypeBadge fileName={item.file_name} />
                    <ListItemText
                      primary={item.file_name}
                      secondary={formatFileSize(item.content_length)}
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
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          No files
        </Typography>
      )}
    </>
  );
};

const LinksBox = ({ links }) => {
  const theme = useTheme();

  return (
    <>
      {links.length > 0 ? (
        <List>
          {links.map((item, index) => {
            const lastItem = index === links.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <Paper elevation={3} sx={{ borderRadius: '12px', width: '100%', display: 'flex', padding: '10px' }}>
                  <ImageCanvas
                    dataUrl={item.thumb_url ? item.thumb_url : NoImage}
                    width={'40px'}
                    height={'40px'}
                    styleCustom={{ borderRadius: '12px' }}
                  />
                  <ListItemText
                    sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}
                    primary={
                      item.file_name
                        ? item.file_name
                        : (() => {
                            try {
                              return item.url ? new URL(item.url).hostname : '';
                            } catch {
                              return '';
                            }
                          })()
                    }
                    secondary={
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.url}
                      </a>
                    }
                    primaryTypographyProps={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    secondaryTypographyProps={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  />
                </Paper>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          No links
        </Typography>
      )}
    </>
  );
};

const ChannelMedia = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel } = useSelector(state => state.channel);

  const [tabIndex, setTabIndex] = useState(0);
  const [medias, setMedias] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (currentChannel) {
      const fetchAttachmentMessages = async () => {
        const response = await currentChannel.queryAttachmentMessages();

        if (response) {
          const { attachments } = response;
          const imagesAndVideos = attachments.filter(attachment =>
            ['image', 'video'].includes(attachment.attachment_type),
          );
          const newFormatMedias = imagesAndVideos.map(item => {
            const isVideo = item.content_type.startsWith('video/');

            if (isVideo) {
              return {
                type: MediaType.VIDEO,
                width: 1280,
                height: 720,
                poster: item.thumb_url,
                sources: [
                  {
                    src: item.url,
                    type: item.content_type,
                  },
                ],
                description: item.file_name,
              };
            } else {
              return {
                type: MediaType.IMAGE,
                src: item.url,
                alt: item.file_name,
                description: item.file_name,
              };
            }
          });

          const files = attachments.filter(attachment => attachment.attachment_type === 'file');
          const links = attachments.filter(attachment => attachment.attachment_type === 'linkPreview');

          setMedias(newFormatMedias);
          setFiles(files);
          setLinks(links);
        }
      };

      fetchAttachmentMessages();
    }
  }, [currentChannel]);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '74px',
        }}
      >
        <Stack
          sx={{ height: '100%' }}
          direction="row"
          alignItems={'center'}
          spacing={2}
          p={2}
          justifyContent="space-between"
        >
          <IconButton
            onClick={() => {
              dispatch(UpdateSidebarType(SidebarType.Channel));
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
            Media & Files
          </Typography>
        </Stack>
      </Box>
      <Stack
        sx={{
          height: 'calc(100% - 74px)',
          position: 'relative',
          flexGrow: 1,
        }}
        spacing={2}
        p={2}
      >
        <Stack sx={{ width: '100%', height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabIndex}
              onChange={handleChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
            >
              {LIST_TAB.map(item => {
                return <Tab key={item.value} label={item.label} />;
              })}
            </Tabs>
          </Box>

          <div style={{ overflowY: 'auto', height: 'calc(100% - 49px)' }} className="customScrollbar">
            <Stack spacing={2} sx={{ paddingTop: '15px' }}>
              {(() => {
                switch (tabIndex) {
                  case 0:
                    return <MediasBox medias={medias} />;
                  case 1:
                    return <FilesBox files={files} />;
                  case 2:
                    return <LinksBox links={links} />;
                  default:
                    break;
                }
              })()}
            </Stack>
          </div>
        </Stack>
      </Stack>
    </>
  );
};

export default ChannelMedia;
