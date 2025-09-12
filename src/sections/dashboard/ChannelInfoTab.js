import React, { useEffect, useState } from 'react';
import { Box, Stack, Tabs, Tab, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChatType, MediaType, SidebarType, TabValueChannelInfo } from '../../constants/commons-const';
import { useDispatch, useSelector } from 'react-redux';
import MemberElement from '../../components/MemberElement';
import { PlayCircle } from 'phosphor-react';
import LightboxMedia from '../../components/LightboxMedia';
import FileElement from '../../components/FileElement';
import NoFile from '../../assets/Illustration/NoFile';
import LinkElement from '../../components/LinkElement';
import { SetUserInfo, UpdateSidebarType } from '../../redux/slices/app';
import ImageCanvas from '../../components/ImageCanvas';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 'auto',
  position: 'sticky',
  top: 0,
  zIndex: 2,
  backgroundColor: theme.palette.background.default,
  margin: '0 -24px',
  padding: '0 24px',
  '& .MuiTab-root': {
    marginRight: '0px!important',
    minWidth: 0,
    minHeight: 'auto',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '32px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.divider, 0.1),
      color: theme.palette.primary.main,
    },
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },

  '& .MuiTabs-indicator': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    height: '100%',
    borderRadius: '32px',
  },

  '& .MuiTabs-scrollButtons': {
    width: 'auto',
    borderRadius: '6px',
    padding: '2px',
  },
}));

const TabMembers = () => {
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const onSelectMember = user => {
    dispatch(UpdateSidebarType(SidebarType.UserInfo));
    dispatch(SetUserInfo(user));
  };

  const rolePriority = {
    owner: 1,
    moder: 2,
    member: 3,
    pending: 4,
  };

  const filteredMembers = members.sort((a, b) => {
    // So sánh theo thứ tự role trước
    if (rolePriority[a.channel_role] !== rolePriority[b.channel_role]) {
      return rolePriority[a.channel_role] - rolePriority[b.channel_role];
    }
    // Nếu role giống nhau, so sánh theo tên (alphabetical order)
    return a.user.name.localeCompare(b.user.name);
  });

  return (
    <Stack spacing={1}>
      {filteredMembers.map(member => (
        <MemberElement key={member.user_id} member={member} onSelectMember={onSelectMember} />
      ))}
    </Stack>
  );
};
const TabMedia = ({ medias }) => {
  const [isOpenLightBox, setIsOpenLightBox] = useState(false);
  const [indexMedia, setIndexMedia] = useState(0);
  return (
    <>
      {medias.length > 0 ? (
        <Box sx={{ margin: '0px -24px -24px', borderRadius: '0px 0px 16px 16px', overflow: 'hidden' }}>
          <Stack direction="row" flexWrap="wrap">
            {medias.map((item, index) => {
              const isVideo = item.type === MediaType.VIDEO;

              return (
                <Box
                  key={index}
                  sx={{
                    width: '33.3333%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    border: '1px solid transparent',
                  }}
                  onClick={() => {
                    setIsOpenLightBox(true);
                    setIndexMedia(index);
                  }}
                >
                  {/* <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    src={isVideo ? item.poster : item.src}
                  /> */}
                  <ImageCanvas dataUrl={isVideo ? item.poster : item.src} width={'100%'} height={'100%'} />
                  {isVideo && (
                    <PlayCircle
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      size={30}
                      weight="fill"
                      color="#fff"
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : (
        <NoFile />
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
const TabLinks = ({ links }) => {
  return (
    <Stack spacing={1}>
      {links.length > 0 ? (
        <>
          {links.map((item, index) => {
            return <LinkElement key={index} link={item} />;
          })}
        </>
      ) : (
        <NoFile />
      )}
    </Stack>
  );
};
const TabFiles = ({ files }) => {
  return (
    <Stack spacing={1}>
      {files.length > 0 ? (
        <>
          {files.map((item, index) => {
            return <FileElement key={index} file={item} />;
          })}
        </>
      ) : (
        <NoFile />
      )}
    </Stack>
  );
};

const ChannelInfoTab = ({ currentChat }) => {
  const [listTab, setListTab] = useState([
    { label: 'Media', value: TabValueChannelInfo.Media },
    { label: 'Links', value: TabValueChannelInfo.Links },
    { label: 'Files', value: TabValueChannelInfo.Files },
  ]);
  const [tabSeledected, setTabSelected] = useState(TabValueChannelInfo.Media);
  const [medias, setMedias] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (currentChat.type === ChatType.TEAM) {
      setListTab(prev => [{ label: 'Members', value: TabValueChannelInfo.Members }, ...prev]);
      setTabSelected(TabValueChannelInfo.Members);
    }
  }, [currentChat]);

  useEffect(() => {
    if (currentChat) {
      const fetchAttachmentMessages = async () => {
        const response = await currentChat.queryAttachmentMessages();

        if (response) {
          const { attachments } = response;

          setMedias(
            attachments
              .filter(attachment => ['image', 'video'].includes(attachment.attachment_type))
              .map(item => {
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
              }),
          );

          setFiles(
            attachments
              .filter(attachment => attachment.attachment_type === 'file')
              .map(item => {
                return {
                  asset_url: item.url,
                  title: item.file_name,
                  file_size: item.content_length,
                  mime_type: item.content_type,
                  type: item.attachment_type,
                  created_at: item.created_at,
                };
              }),
          );

          setLinks(
            attachments
              .filter(attachment => attachment.attachment_type === 'linkPreview')
              .map(item => {
                const user = currentChat.state?.members[item.user_id]?.user || {};
                return {
                  thumb_url: item.thumb_url,
                  url: item.url,
                  type: item.attachment_type,
                  title: item.file_name,
                  created_at: item.created_at,
                  user,
                };
              }),
          );
        }
      };

      fetchAttachmentMessages();
    }
  }, [currentChat]);

  const renderTabContent = () => {
    switch (tabSeledected) {
      case TabValueChannelInfo.Members:
        return <TabMembers />;
      case TabValueChannelInfo.Media:
        return <TabMedia medias={medias} />;
      case TabValueChannelInfo.Links:
        return <TabLinks links={links} />;
      case TabValueChannelInfo.Files:
        return <TabFiles files={files} />;
      default:
        return null;
    }
  };

  return (
    <>
      <StyledTabs
        value={tabSeledected}
        onChange={(event, newValue) => {
          setTabSelected(newValue);
        }}
        variant="fullWidth"
      >
        {listTab.map((item, index) => {
          return <Tab key={index} value={item.value} label={item.label} />;
        })}
      </StyledTabs>

      <Box mt={2}>{renderTabContent()}</Box>
    </>
  );
};

export default ChannelInfoTab;
