import React, { useEffect, useState } from 'react';
import { Stack, styled, useTheme, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../../components/ChannelAvatar';
import { formatString, isPublicChannel } from '../../utils/commons';

import AvatarComponent from '../../components/AvatarComponent';
import { LoadingButton } from '@mui/lab';
import { FetchChannels } from '../../redux/slices/channel';
import { FetchTokenGateByChannelId } from '../../redux/slices/wallet';

const StyledTokenGate = styled(Stack)(({ theme }) => ({
  position: 'absolute',
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  zIndex: 1,
}));

const ChannelTokenGate = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [loadingJoin, setLoadingJoin] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [conditions, setConditions] = useState([]);

  const { currentChannel } = useSelector(state => state.channel);
  const { tokenGateData } = useSelector(state => state.wallet);
  const isPublic = isPublicChannel(currentChannel);

  const channelId = currentChannel?.id;

  useEffect(() => {
    if (channelId) {
      dispatch(FetchTokenGateByChannelId(channelId));
    }
  }, [channelId]);

  const onJoinChannel = async () => {
    try {
      setLoadingJoin(true);
      const response = await currentChannel.acceptInvite('join');

      if (response) {
        setLoadingJoin(false);
        if (response.ermis_code) {
          setErrMsg(response.message);
          setConditions(response.channel_condition);
        } else {
          // dispatch(FetchChannels());
        }
      }
    } catch (error) {
      setLoadingJoin(false);
      setErrMsg(error?.message || error.response.data?.message || 'Something went wrong');
    }
  };

  const onGetToken = id => {
    const condition = conditions.find(item => item.id === id);

    if (condition) {
      window.open(condition.link_to_purchase, '_blank');
    }
  };

  if (!currentChannel) return null;

  return (
    <StyledTokenGate
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
        {tokenGateData.length ? (
          <Typography
            variant="body1"
            sx={{ color: theme.palette.grey[600], margin: 0, textAlign: 'center', fontSize: '14px' }}
          >
            <span style={{ display: 'block', marginBottom: '15px' }}>You need to hold any of tokens:</span>
            {tokenGateData.map(item => {
              return (
                <span key={item.id} style={{ display: 'block', marginBottom: '15px' }}>
                  {item.minimum_balance} x <strong style={{ color: theme.palette.text.primary }}>{item?.symbol}</strong>
                  {conditions.length ? (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ borderRadius: '32px', marginLeft: '15px' }}
                      onClick={() => onGetToken(item.id)}
                    >
                      Get token
                    </Button>
                  ) : null}
                </span>
              );
            })}
          </Typography>
        ) : null}

        {errMsg && (
          <Typography
            variant="body1"
            sx={{ color: theme.palette.error.main, margin: '0 0 15px', textAlign: 'center', fontSize: '14px' }}
          >
            {errMsg}
          </Typography>
        )}

        <Stack direction="row" justifyContent="center" sx={{ marginTop: '30px' }}>
          <LoadingButton variant="outlined" onClick={onJoinChannel} loading={loadingJoin}>
            Join channel
          </LoadingButton>
        </Stack>
      </Stack>
    </StyledTokenGate>
  );
};

export default ChannelTokenGate;
