import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { IconButton, Stack, styled, Typography } from '@mui/material';
import { X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar, ToggleSidebar } from '../../redux/slices/app';
import { AvatarShape, ChatType, ConfirmType } from '../../constants/commons-const';
import MemberAvatar from '../../components/MemberAvatar';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { IdentityIcon, NewChatIcon, ProfileAddIcon, UserOctagonIcon } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import { onEditMessage, onReplyMessage } from '../../redux/slices/messages';
import { client } from '../../client';
import { checkDirectBlock } from '../../utils/commons';
import { setChannelConfirm } from '../../redux/slices/dialog';
import { ClientEvents } from '../../constants/events-const';
import { SetOpenTopicPanel } from '../../redux/slices/topic';
import { useTranslation } from 'react-i18next';

const StyledActionItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  padding: '5px',
  gap: '8px',
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
    minWidth: 'auto',
    overflow: 'hidden',
    flex: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const SidebarUserInfo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { userInfo } = useSelector(state => state.app);
  const { activeChannels = [] } = useSelector(state => state.channel);
  const onlineStatus = useOnlineStatus(userInfo?.id || '');
  const [isBlocked, setIsBlocked] = useState(false);

  const directChannel =
    activeChannels && activeChannels.length
      ? activeChannels.find(channel => {
          const isDirect = channel.type === ChatType.MESSAGING;
          return isDirect && channel.state.members[userInfo.id];
        })
      : null;

  useEffect(() => {
    if (directChannel) {
      setIsBlocked(checkDirectBlock(directChannel));

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

      directChannel.on(ClientEvents.MemberBlocked, handleMemberBlocked);
      directChannel.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);

      return () => {
        directChannel.off(ClientEvents.MemberBlocked, handleMemberBlocked);
        directChannel.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
      };
    }
  }, [directChannel, user_id]);

  const onNavigateToChannel = (channelType, channelId) => {
    navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
    dispatch(onReplyMessage(null));
    dispatch(onEditMessage(null));
    dispatch(SetOpenTopicPanel(false));
  };

  const onStartChat = () => {
    if (directChannel) {
      onNavigateToChannel(directChannel.type, directChannel.id);
    }
  };

  const onCreateDirectChannel = async () => {
    try {
      const channel = await client.channel(ChatType.MESSAGING, {
        members: [userInfo.id, user_id],
      });
      const response = await channel.create();

      if (response) {
        dispatch(showSnackbar({ severity: 'success', message: t('sidebarUserInfo.invitation') }));
        onNavigateToChannel(response.channel.type, response.channel.id);
      }
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: t('sidebarUserInfo.invite_failed') }));
    }
  };

  const onToogleBlockUser = () => {
    const payload = {
      openDialog: true,
      channel: directChannel,
      userId: userInfo.id,
      type: isBlocked ? ConfirmType.UNBLOCK : ConfirmType.BLOCK,
    };
    dispatch(setChannelConfirm(payload));
  };

  if (!userInfo) return null;

  return (
    <Stack sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <IconButton
          onClick={() => {
            dispatch(ToggleSidebar());
          }}
        >
          <X size={20} color={theme.palette.text.primary} />
        </IconButton>

        {/* <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          Profile
        </Typography> */}
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
      >
        <Stack alignItems="center" direction="column" spacing={1}>
          {/* --------------------avatar-------------------- */}
          <>
            <MemberAvatar member={userInfo} width={130} height={130} openLightbox={true} shape={AvatarShape.Round} />
          </>
          {/* --------------------user name-------------------- */}
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
            title={userInfo?.name}
          >
            {userInfo?.name}
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
        </Stack>

        <Stack spacing={2} sx={{ marginTop: '30px' }}>
          {/* ------------User ID--------------- */}
          <StyledActionItem>
            <IdentityIcon color={theme.palette.text.primary} />
            <Typography variant="subtitle2" color={theme.palette.text.primary}>
              {userInfo?.id}
            </Typography>
          </StyledActionItem>

          {directChannel ? (
            <>
              {/* ------------Chat--------------- */}
              <StyledActionItem className="hoverItem" onClick={onStartChat}>
                <NewChatIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.text.primary}>
                  {t('sidebarUserInfo.chat')}
                </Typography>
              </StyledActionItem>
            </>
          ) : (
            <>
              {/* ------------Add to contacts--------------- */}
              <StyledActionItem className="hoverItem" onClick={onCreateDirectChannel}>
                <ProfileAddIcon color={theme.palette.text.primary} />
                <Typography variant="subtitle2" color={theme.palette.text.primary}>
                  {t('sidebarUserInfo.add_contact')}
                </Typography>
              </StyledActionItem>
            </>
          )}

          {/* ------------Block User--------------- */}
          {directChannel && (
            <StyledActionItem className="hoverItem" onClick={onToogleBlockUser}>
              <UserOctagonIcon color={theme.palette.text.primary} colorUser={theme.palette.error.main} />
              <Typography variant="subtitle2" color={theme.palette.error.main}>
                {isBlocked ? t('sidebarUserInfo.unblock') : t('sidebarUserInfo.block')}
              </Typography>
            </StyledActionItem>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarUserInfo;
