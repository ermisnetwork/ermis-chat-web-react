import React, { useCallback, useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { IconButton, InputAdornment, Stack, Typography } from '@mui/material';
import { CaretRight, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { ToggleSidebar, UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import ChannelAvatar from '../../components/ChannelAvatar';
import {
  checkDirectBlock,
  processImageFile,
  handleError,
  isChannelDirect,
  isPublicChannel,
  myRoleInChannel,
} from '../../utils/commons';
import { AvatarShape, ConfirmType, RoleMember, SidebarType } from '../../constants/commons-const';
import ClipboardCopy from '../../components/ClipboardCopy';
import { LoadingButton } from '@mui/lab';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField, RHFUploadAvatar } from '../../components/hook-form';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { setChannelConfirm, SetOpenInviteFriendDialog } from '../../redux/slices/dialog';
import { ClientEvents } from '../../constants/events-const';
import { DOMAIN_APP } from '../../config';
import AntSwitch from '../../components/AntSwitch';
import ChannelNotificationDialog from './ChannelNotificationDialog';
import { AddMutedChannel, RemoveMutedChannel } from '../../redux/slices/channel';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import {
  AdministratorsIcon,
  BannedIcon,
  BellIcon,
  DeviceMessageIcon,
  DocumentFilterIcon,
  EditIcon,
  EditOctagonIcon,
  FlashCircleIcon,
  LinkIcon,
  LogoutIcon,
  PeopleIcon,
  ProfileAddIcon,
  StickyNoteIcon,
  TrashIcon,
  UserOctagonIcon,
  UsersIcon,
} from '../../components/Icons';
import ChannelInfoTab from './ChannelInfoTab';

const StyledStackItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  padding: '5px',
  '&.hoverItem': {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    borderRadius: '10px',
    '&:hover': {
      backgroundColor: theme.palette.divider,
    },
  },
  '& .MuiTypography-root': {
    fontSize: '14px',
    fontWeight: 600,
  },
}));

const StyledActionItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  borderRadius: '10px',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  padding: '5px',
  gap: '8px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.divider,
  },

  '& .MuiTypography-root': {
    fontSize: '14px',
    fontWeight: 600,
    minWidth: 'auto',
    overflow: 'hidden',
    flex: 1,
  },
}));

const FormTeamChannelInfo = ({ isEditing, setIsEditing, formSubmitRef, setSaveDisabled, setSaveLoading }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);

  const channelInfo = {
    name: currentChannel.data.name || '',
    description: currentChannel.data.description || '',
    image: currentChannel.data?.image || '',
  };

  const NewGroupSchema = Yup.object().shape({
    name: Yup.string().trim().required('Channel name is required').max(255, 'Max 255 characters'),
  });

  const defaultValues = {
    image: channelInfo.image,
    name: channelInfo.name,
    description: channelInfo.description,
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    mode: 'onChange',
    defaultValues,
  });

  const { watch, setValue, handleSubmit } = methods;
  const description = watch('description', '');
  const wordCount = description ? description.trim().length : 0;

  const handleDrop = useCallback(
    async acceptedFiles => {
      const file = acceptedFiles[0];
      const isImage = file.type.startsWith('image/');

      if (!isImage) {
        dispatch(showSnackbar({ severity: 'error', message: 'Please upload an image file!' }));
      } else {
        const fileCompress = await processImageFile(file, true);

        if (fileCompress) {
          const newFile = Object.assign(fileCompress, {
            preview: URL.createObjectURL(fileCompress),
          });
          if (fileCompress) {
            setValue('image', newFile, { shouldValidate: true });
          }
        }
      }
    },
    [setValue],
  );

  const onSubmit = async data => {
    try {
      const { name, description, image } = data;
      const params = {};

      if (name && name.trim() !== defaultValues.name.trim()) {
        params.name = name;
      }

      if (description.trim() !== defaultValues.description.trim()) {
        params.description = description;
      }

      if (typeof image === 'object' && image !== null) {
        setSaveLoading(true);
        const response = await currentChannel.sendFile(image);
        if (response) {
          params.image = response.file;
        }
      }

      setSaveLoading(true);
      await currentChannel.update(params);
      dispatch(showSnackbar({ severity: 'success', message: 'Channel updated successfully' }));
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setSaveLoading(false);
      setIsEditing(false);
    }
  };

  const watchValues = () => {
    const data = watch();

    return {
      name: data.name.trim(),
      description: data.description.trim(),
      image: data.image,
    };
  };

  useEffect(() => {
    if (formSubmitRef) {
      formSubmitRef.current = handleSubmit(onSubmit);
    }
  }, [formSubmitRef, handleSubmit, onSubmit]);

  useEffect(() => {
    const noChanges =
      watchValues().name === defaultValues.name &&
      watchValues().description === defaultValues.description &&
      ((typeof defaultValues.image === 'string' &&
        typeof watchValues().image === 'string' &&
        watchValues().image === defaultValues.image) ||
        (typeof defaultValues.image === 'object' && typeof watchValues().image === 'object'));

    setSaveDisabled(noChanges);
  }, [watchValues, defaultValues]);

  return (
    <>
      <Stack sx={{ width: '100%' }}>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={1} alignItems="center" direction="column">
            {/* --------------------avatar-------------------- */}
            {isEditing ? (
              <RHFUploadAvatar name="image" onDrop={handleDrop} />
            ) : (
              <ChannelAvatar
                channel={currentChannel}
                width={130}
                height={130}
                openLightbox={true}
                shape={AvatarShape.Round}
              />
            )}
            {/* --------------------channel name-------------------- */}
            <Typography
              variant="subtitle2"
              sx={{
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'center',
              }}
              title={channelInfo?.name}
            >
              {channelInfo?.name}
            </Typography>
            {/* --------------------member_count-------------------- */}
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '14px',
                textAlign: 'center',
                marginTop: '0px !important',
              }}
            >
              {`${currentChannel.data.member_count} members`}
            </Typography>
            {/* --------------------channel description-------------------- */}
            {!isEditing && currentChannel.data.description && (
              <Typography style={{ fontSize: '16px', textAlign: 'center', ...styleDescription }}>
                {channelInfo?.description}
              </Typography>
            )}

            {isEditing && (
              <Stack spacing={2} sx={{ width: '100%' }}>
                <RHFTextField
                  name="name"
                  placeholder="Channel name"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UsersIcon color={theme.palette.text.primary} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '16px',
                    },
                  }}
                />

                <RHFTextField
                  multiline
                  rows={4}
                  name="description"
                  placeholder="Description"
                  inputProps={{
                    maxLength: 100,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EditIcon color={theme.palette.text.primary} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '16px',
                      alignItems: 'baseline',
                    },
                    '& .MuiFormHelperText-root': {
                      textAlign: 'right',
                      marginRight: '0px',
                    },
                  }}
                  helperText={`${wordCount}/100 words`}
                />
              </Stack>
            )}
          </Stack>
        </FormProvider>
      </Stack>
    </>
  );
};

const DirectChannelInfo = ({}) => {
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const memberIds = Object.keys(currentChannel.state.members);
  const otherMemberId = memberIds.find(member => member !== user_id);
  const onlineStatus = useOnlineStatus(otherMemberId || '');

  return (
    <>
      {/* --------------------avatar-------------------- */}
      <>
        <ChannelAvatar
          channel={currentChannel}
          width={130}
          height={130}
          openLightbox={true}
          shape={AvatarShape.Round}
        />
      </>
      {/* --------------------channel name-------------------- */}
      <Typography
        variant="subtitle2"
        sx={{
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '18px',
          fontWeight: 600,
          textAlign: 'center',
        }}
        title={currentChannel.data.name}
      >
        {currentChannel.data.name}
      </Typography>
      {/* --------------------onlineStatus-------------------- */}
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: '14px',
          textAlign: 'center',
          marginTop: '0px !important',
        }}
      >
        {onlineStatus}
      </Typography>
    </>
  );
};

const styleDescription = {
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 3,
  lineClamp: 3,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
};

const SidebarChannelInfo = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const formSubmitRef = useRef(null);
  const { currentChannel, mutedChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const myRole = myRoleInChannel(currentChannel);
  const isDirect = isChannelDirect(currentChannel);
  const isPublic = isPublicChannel(currentChannel);
  const members = isDirect ? Object.keys(currentChannel.state?.members || {}) || [] : [];
  const otherMemberId = isDirect ? members.find(member => member !== user_id) : '';

  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [openDialogMuted, setOpenDialogMuted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const enableTopics = currentChannel?.data?.topics_enabled;

  useEffect(() => {
    if (currentChannel) {
      setIsMuted(!!(mutedChannels && mutedChannels.some(item => item.id === currentChannel.id)));

      setIsBlocked(checkDirectBlock(currentChannel));

      const handleMemberBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(true);
        }
      };

      const handleMemberUnBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(false);
        }
      };

      const handleMemberUpdated = event => {
        if (event.user.id === user_id) {
          const channelId = event.channel_id;
          if (event.member.muted) {
            dispatch(AddMutedChannel(event.cid));
            dispatch(showSnackbar({ severity: 'success', message: 'Notifications have been muted' }));
            setOpenDialogMuted(false);
            setIsMuted(true);
          } else {
            dispatch(RemoveMutedChannel(channelId));
            dispatch(showSnackbar({ severity: 'success', message: 'Notifications have been unmuted' }));
            setIsMuted(false);
          }
        }
      };

      currentChannel.on(ClientEvents.MemberBlocked, handleMemberBlocked);
      currentChannel.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
      currentChannel.on(ClientEvents.MemberUpdated, handleMemberUpdated);

      return () => {
        currentChannel.off(ClientEvents.MemberBlocked, handleMemberBlocked);
        currentChannel.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
        currentChannel.off(ClientEvents.MemberUpdated, handleMemberUpdated);
      };
    }
  }, [currentChannel, user_id, mutedChannels, isDirect]);

  const onChangeMute = async event => {
    const checked = event.target.checked;
    if (checked) {
      setOpenDialogMuted(true);
    } else {
      await currentChannel.unMuteNotification();
    }
  };

  const onToogleBlockUser = () => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: user_id,
      type: isBlocked ? ConfirmType.UNBLOCK : ConfirmType.BLOCK,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onClearChatHistory = () => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: user_id,
      type: ConfirmType.TRUNCATE,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onLeaveChannel = () => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: user_id,
      type: ConfirmType.LEAVE,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onDeleteChannel = () => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: user_id,
      type: ConfirmType.DELETE_CHANNEL,
    };
    dispatch(setChannelConfirm(payload));
  };

  const onInviteFriend = () => {
    dispatch(SetOpenInviteFriendDialog(true));
  };

  const onEditing = () => {
    setIsEditing(true);
  };

  const onSaveClick = () => {
    if (formSubmitRef.current) formSubmitRef.current();
  };

  const fullUrl = `${DOMAIN_APP}/channels/${currentChannel?.cid}`;
  const showItemMembers = !isDirect && isEditing;
  const showItemAdministrators = !isDirect && myRole === RoleMember.OWNER && isEditing;
  const showItemBanned = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole) && isEditing;
  const showItemPermissions = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole) && isEditing;
  const showEditChannel = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole);
  const showItemLeaveChannel = !isDirect && [RoleMember.MOD, RoleMember.MEMBER].includes(myRole);
  const showItemDeleteChannel = !isDirect && [RoleMember.OWNER].includes(myRole);
  const showItemDeleteChat = isDirect;
  const showItemKeywordFiltering = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole) && isEditing;
  const showItemBlockUser = isDirect;
  const showItemInviteFriend = !isDirect && !isEditing;
  const showItemChannelType = !isDirect && isEditing;
  const showItemChannelTopics = !isDirect && isEditing;

  if (!currentChannel) return null;

  return (
    <>
      <Stack sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
          <IconButton
            onClick={() => {
              dispatch(ToggleSidebar());
            }}
          >
            <X size={20} color={theme.palette.text.primary} />
          </IconButton>

          {showEditChannel && (
            <>
              {isEditing ? (
                <LoadingButton
                  variant="text"
                  size="small"
                  onClick={onSaveClick}
                  disabled={saveDisabled}
                  loading={saveLoading}
                >
                  SAVE
                </LoadingButton>
              ) : (
                <IconButton onClick={onEditing}>
                  <EditOctagonIcon size={20} color={theme.palette.text.primary} />
                </IconButton>
              )}
            </>
          )}
        </Stack>

        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            width: '100%',
            height: '100%',
            position: 'relative',
            padding: '0 24px 24px',
          }}
          spacing={3}
        >
          <Stack alignItems="center" direction="column" spacing={1}>
            {isDirect ? (
              <DirectChannelInfo />
            ) : (
              <FormTeamChannelInfo
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                formSubmitRef={formSubmitRef}
                setSaveDisabled={setSaveDisabled}
                setSaveLoading={setSaveLoading}
              />
            )}

            {/* --------------------public URL or user ID-------------------- */}
            {!isEditing && (isPublic || otherMemberId) && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: theme.palette.background.neutral,
                  width: '100%',
                  marginTop: '20px !important',
                }}
              >
                <LinkIcon color={theme.palette.text.primary} />
                <Typography
                  title={isPublic ? fullUrl : otherMemberId}
                  sx={{
                    minWidth: 'auto',
                    overflow: 'hidden',
                    flex: 1,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontSize: '14px',
                    color: theme.palette.text.primary,
                  }}
                >
                  {isPublic ? fullUrl : otherMemberId}
                </Typography>
                <ClipboardCopy text={isPublic ? fullUrl : otherMemberId} message="Copied to clipboard" />
              </Stack>
            )}
          </Stack>

          <Stack spacing={2}>
            {/* ------------Mute Notifications--------------- */}
            {!isEditing && (
              <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BellIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">{isMuted ? 'Unmute' : 'Mute'} Notifications</Typography>
                </Stack>

                <AntSwitch onChange={onChangeMute} checked={isMuted} />
              </StyledStackItem>
            )}

            {/* ------------Invite Friend--------------- */}
            {showItemInviteFriend && (
              <StyledActionItem onClick={onInviteFriend}>
                <ProfileAddIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.text.primary}>
                  Invite Friend
                </Typography>
              </StyledActionItem>
            )}

            {/* ------------Block User--------------- */}
            {showItemBlockUser && (
              <StyledActionItem onClick={onToogleBlockUser}>
                <UserOctagonIcon color={theme.palette.text.primary} colorUser={theme.palette.error.main} />
                <Typography variant="subtitle2" color={theme.palette.error.main}>
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </Typography>
              </StyledActionItem>
            )}

            {/* ------------Channel Type--------------- */}
            {showItemChannelType && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.ChannelType));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DeviceMessageIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Channel Type</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="subtitle2"
                    color={theme.palette.text.secondary}
                    sx={{ fontWeight: `400 !important` }}
                  >
                    {isPublic ? 'Public' : 'Private'}
                  </Typography>
                  <CaretRight size={20} />
                </Stack>
              </StyledStackItem>
            )}

            {/* ------------Channel Topics--------------- */}
            {showItemChannelTopics && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.ChannelTopics));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StickyNoteIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Channel Topics</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="subtitle2"
                    color={theme.palette.text.secondary}
                    sx={{ fontWeight: `400 !important` }}
                  >
                    {enableTopics ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <CaretRight size={20} />
                </Stack>
              </StyledStackItem>
            )}

            {/* ------------Members--------------- */}
            {showItemMembers && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.Members));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PeopleIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Members</Typography>
                </Stack>

                <CaretRight size={20} />
              </StyledStackItem>
            )}

            {/* ------------Permissions--------------- */}
            {showItemPermissions && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.Permissions));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FlashCircleIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Permissions</Typography>
                </Stack>

                <CaretRight size={20} />
              </StyledStackItem>
            )}

            {/* ------------Administrators--------------- */}
            {showItemAdministrators && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.Administrators));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AdministratorsIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Administrators</Typography>
                </Stack>

                <CaretRight size={20} />
              </StyledStackItem>
            )}

            {/* ------------Banned Members--------------- */}
            {showItemBanned && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.BannedUsers));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BannedIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Banned Members</Typography>
                </Stack>

                <CaretRight size={20} />
              </StyledStackItem>
            )}

            {/* ------------Keyword Filtering--------------- */}
            {showItemKeywordFiltering && (
              <StyledStackItem
                direction="row"
                alignItems="center"
                justifyContent={'space-between'}
                className="hoverItem"
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.KeywordFiltering));
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DocumentFilterIcon color={theme.palette.text.primary} />
                  <Typography variant="subtitle2">Keyword Filtering</Typography>
                </Stack>

                <CaretRight size={20} />
              </StyledStackItem>
            )}

            {/* ------------Clear chat history--------------- */}
            {showItemDeleteChat && (
              <StyledActionItem onClick={onClearChatHistory}>
                <TrashIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.error.main}>
                  Clear chat history
                </Typography>
              </StyledActionItem>
            )}

            {/* ------------Leave channel--------------- */}
            {showItemLeaveChannel && (
              <StyledActionItem onClick={onLeaveChannel}>
                <LogoutIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.error.main}>
                  Leave channel
                </Typography>
              </StyledActionItem>
            )}

            {/* ------------Delete channel--------------- */}
            {showItemDeleteChannel && (
              <StyledActionItem onClick={onDeleteChannel}>
                <TrashIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.error.main}>
                  Delete channel
                </Typography>
              </StyledActionItem>
            )}
          </Stack>

          {/* ------------Channel info tab--------------- */}
          {!isEditing && (
            <Stack>
              <ChannelInfoTab currentChat={currentChannel} />
            </Stack>
          )}
        </Stack>
      </Stack>

      <ChannelNotificationDialog openDialogMuted={openDialogMuted} setOpenDialogMuted={setOpenDialogMuted} />
    </>
  );
};

export default SidebarChannelInfo;
