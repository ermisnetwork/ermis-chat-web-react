import React from 'react';
import { Stack, styled, useTheme, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../../components/ChannelAvatar';
import { formatString, handleError, isPublicChannel } from '../../utils/commons';
import { ChatType, RoleMember } from '../../constants/commons-const';
import AvatarComponent from '../../components/AvatarComponent';
import { useNavigate } from 'react-router-dom';

const StyledInvitation = styled(Stack)(({ theme }) => ({
  position: 'absolute',
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  zIndex: 1,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  minWidth: '90px',
  margin: '0 6px',
}));

const ChannelInvitation = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentChannel } = useSelector(state => state.channel);
  const isPublic = isPublicChannel(currentChannel);

  const channelType = currentChannel?.type;
  const membership = currentChannel?.state?.membership;
  const channelRole = membership?.channel_role;

  const onAcceptInvite = async () => {
    try {
      await currentChannel.acceptInvite('accept');
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const onRejectInvite = async () => {
    try {
      await currentChannel.rejectInvite();
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const onSkipInvite = async () => {
    try {
      await currentChannel.skipInvite();
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  if (!currentChannel) return null;

  return (
    <StyledInvitation
      direction="row"
      justifyContent="center"
      alignItems="center"
      sx={{ backgroundColor: theme.palette.mode === 'light' ? '#F0F4FA' : '#000' }}
    >
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          width: '400px',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: theme.palette.mode === 'light' ? '#FFF' : theme.palette.background.paper,
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        {isPublic ? (
          <AvatarComponent
            name={currentChannel.data.name}
            url={currentChannel.data.image}
            width={100}
            height={100}
            isPublic={isPublic}
            openLightbox={true}
          />
        ) : (
          <ChannelAvatar channel={currentChannel} width={100} height={100} openLightbox={true} />
        )}
        <Typography variant="h6" sx={{ color: theme.palette.text.primary, margin: '15px 0' }}>
          {formatString(currentChannel.data.name)}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.grey[600], margin: '0 0 15px', textAlign: 'center', fontSize: '14px' }}
        >
          Accept the invite to see all messages of this {channelType === ChatType.TEAM ? 'channel' : 'conversation'}
        </Typography>
        <Stack direction="row" justifyContent="space-between">
          <StyledButton variant="contained" color="primary" onClick={onAcceptInvite}>
            Accept
          </StyledButton>
          {channelType === ChatType.TEAM && (
            <StyledButton variant="contained" color="error" onClick={onRejectInvite}>
              Decline
            </StyledButton>
          )}

          {channelType === ChatType.MESSAGING && channelRole === RoleMember.PENDING && (
            <StyledButton variant="contained" color="error" onClick={onSkipInvite}>
              Skip
            </StyledButton>
          )}
        </Stack>
      </Stack>
    </StyledInvitation>
  );
};

export default ChannelInvitation;
