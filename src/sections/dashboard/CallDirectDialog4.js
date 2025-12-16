import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
  Typography,
  useTheme,
  styled,
  Box,
  Paper,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useDispatch, useSelector } from 'react-redux';
import { callClient } from '../../client';
import { CallStatus, CallType } from '../../constants/commons-const';
import { DisconnectCallDirect, setCallDirectStatus, StartCallDirect } from '../../redux/slices/callDirect';
import MemberAvatar from '../../components/MemberAvatar';
import {
  ChatCircleDots,
  Microphone,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  Screencast,
  VideoCamera,
  VideoCameraSlash,
  X,
  CaretDown,
  ArrowsOut,
  ArrowsIn,
} from 'phosphor-react';
import { Howl } from 'howler';
import { showSnackbar } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledCallDirectDialog = styled(Dialog, {
  shouldForwardProp: prop => prop !== 'isFullScreen',
})(({ theme, isFullScreen }) => ({
  '& .MuiDialog-container': {
    '& .MuiPaper-root': {
      width: isFullScreen ? '100vw' : '500px',
      height: isFullScreen ? '100vh' : '550px',
      maxWidth: isFullScreen ? '100vw' : 'none',
      maxHeight: isFullScreen ? '100vh' : 'none',
      margin: isFullScreen ? 0 : 'auto',
      borderRadius: isFullScreen ? 0 : theme.shape.borderRadius,
      background: '#000',
      '&:hover .hoverShow': {
        opacity: 1,
      },
      '& .receiverAvatar': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: isFullScreen ? '120px' : '70px',
      },

      '& .MuiDialogActions-root': {
        padding: '15px',
        position: 'relative',
        zIndex: 1,
        '& >:not(:first-of-type)': {
          marginLeft: '0px',
        },
      },

      '& .hoverShow': {
        opacity: 0,
      },
    },
  },
}));

const StyledButton = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  width: '70px',
  position: 'relative',
  '& .MuiButton-root': {
    minWidth: '45px',
    height: '45px',
    borderRadius: '50%',
    padding: 0,
    color: '#fff',
    boxShadow: 'none',
    '&.moreButton': {
      backgroundColor: theme.palette.grey[300],
      '&:hover, &.active': {
        backgroundColor: theme.palette.grey[600],
      },
    },
  },
  ' & .spanTitle': {
    fontSize: '12px',
    display: 'block',
    '&.whiteColor': {
      color: '#fff',
    },
  },
  '& .deviceToggle': {
    position: 'absolute',
    top: '14px',
    right: '2px',
    minWidth: '20px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    padding: 0,
    backgroundColor: theme.palette.grey[500],
    color: '#fff',
    border: '1px solid #fff',
    '&:hover': {
      backgroundColor: theme.palette.grey[700],
    },
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: '200px',
    marginTop: '8px',
  },
  '& .MuiMenuItem-root': {
    padding: '8px 16px',
    '&.selected': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const CallDirectDialog4 = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const ringtone = useRef();
  const { callDirectStatus, callDirectData, openCallDirectDialog } = useSelector(state => state.callDirect);
  const callerInfo = callDirectData?.callerInfo;
  const receiverInfo = callDirectData?.receiverInfo;
  const { user_id } = useSelector(state => state.auth);

  const [micOn, setMicOn] = useState(true);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [time, setTime] = useState(0);
  const [loadingButton, setLoadingButton] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [localCameraOn, setLocalCameraOn] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);
  const [requestVideoCall, setRequestVideoCall] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [isUpgradeCall, setIsUpgradeCall] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Device management states
  const [availableAudioDevices, setAvailableAudioDevices] = useState([]);
  const [availableVideoDevices, setAvailableVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);

  // Menu states for device selection
  const [micMenuAnchor, setMicMenuAnchor] = useState(null);
  const [cameraMenuAnchor, setCameraMenuAnchor] = useState(null);

  const onCancelCall = () => {
    setMicOn(true);
    setIsScreenShare(false);
    setTime(0);
    setLoadingButton(false);
    setConnectionStatus('');
    setLocalCameraOn(false);
    setRemoteCameraOn(false);
    setRequestVideoCall(false);
    setRemoteMicOn(true);
    setMinimized(false);
    setIsUpgradeCall(false);
    setIsFullScreen(false);

    // Close device menus
    setMicMenuAnchor(null);
    setCameraMenuAnchor(null);

    dispatch(DisconnectCallDirect());
    stopRing();

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (ringtone.current) {
      ringtone.current.stop();
      ringtone.current = null;
    }
  };

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRing = () => {
    const audioFile = callDirectData?.type === 'incoming' ? '/call_incoming.mp3' : '/call_outgoing.mp3';
    ringtone.current = new Howl({
      src: [audioFile],
      loop: true,
    });
    ringtone.current.play();
  };

  const stopRing = () => {
    if (ringtone.current) {
      ringtone.current.stop();
    }
  };

  // Load available devices when call starts
  const loadDevices = async () => {
    if (callClient) {
      try {
        const { audioDevices, videoDevices } = await callClient.getDevices();

        setAvailableAudioDevices(audioDevices);
        setAvailableVideoDevices(videoDevices);

        // Set default selected devices
        const { audioDevice, videoDevice } = callClient.getSelectedDevices();
        setSelectedAudioDevice(audioDevice || audioDevices[0] || null);
        setSelectedVideoDevice(videoDevice || videoDevices[0] || null);
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    }
  };

  useEffect(() => {
    if (callDirectData && callDirectStatus === CallStatus.RINGING) {
      startRing();
      loadDevices(); // Load devices when call starts
    }
  }, [callDirectData, callDirectStatus]);

  useEffect(() => {
    if (!callClient) return;

    callClient.onCallEvent = async data => {
      dispatch(StartCallDirect(data));
      setLocalCameraOn(data.callType === CallType.VIDEO);
      setRemoteCameraOn(data.callType === CallType.VIDEO);
    };

    callClient.onLocalStream = stream => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    callClient.onRemoteStream = stream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    callClient.onScreenShareChange = isShare => {
      setIsScreenShare(isShare);
    };

    callClient.onUpgradeCall = user => {
      setIsUpgradeCall(true);
      setRemoteCameraOn(true);
      if (user.id !== user_id) {
        setRequestVideoCall(true);
      }
    };

    callClient.onDataChannelMessage = data => {
      const remoteVideoEnable = data.video_enable;
      const remoteAudioEnable = data.audio_enable;
      setRemoteCameraOn(remoteVideoEnable);
      setRemoteMicOn(remoteAudioEnable);
    };

    callClient.onConnectionMessageChange = msg => {
      setConnectionStatus(msg);
    };

    callClient.onCallStatus = status => {
      dispatch(setCallDirectStatus(status));
      switch (status) {
        case CallStatus.RINGING:
          break;
        case CallStatus.CONNECTED:
          startTimer();
          setLoadingButton(false);
          stopRing();
          break;
        case CallStatus.ENDED:
          onCancelCall();
          break;
        default:
          onCancelCall();
          break;
      }
    };

    callClient.onError = msg => {
      dispatch(showSnackbar({ severity: 'error', message: msg }));
    };

    callClient.onDeviceChange = (audioDevices, videoDevices) => {
      setAvailableAudioDevices(audioDevices);
      setAvailableVideoDevices(videoDevices);
    };

    return () => {
      if (callClient) {
        callClient.onCallEvent = undefined;
        callClient.onLocalStream = undefined;
        callClient.onRemoteStream = undefined;
        callClient.onConnectionMessageChange = undefined;
        callClient.onCallStatus = undefined;
        callClient.onDataChannelMessage = undefined;
        callClient.onUpgradeCall = undefined;
        callClient.onScreenShareChange = undefined;
        callClient.onError = undefined;
        callClient.onDeviceChange = undefined;
      }
    };
  }, [dispatch, callClient, user_id]);

  const onSendAcceptCall = async () => {
    setLoadingButton(true);
    await callClient.acceptCall();
  };

  const onSendEndCall = async () => {
    await callClient.endCall();
  };

  const onSendRejectCall = async () => {
    await callClient.rejectCall();
  };

  const onSwitchToVideoCall = async () => {
    await callClient.requestUpgradeCall(true);
    setLocalCameraOn(!localCameraOn);
    setRequestVideoCall(false);
  };

  const onToggleMic = () => {
    callClient.toggleMic(!micOn);
    setMicOn(!micOn);
  };

  const onToggleCamera = async () => {
    callClient.toggleCamera(!localCameraOn);
    setLocalCameraOn(!localCameraOn);

    if (callDirectData.callType === CallType.AUDIO && !isUpgradeCall) {
      await callClient.upgradeCall();
    }
  };

  const onScreenShare = async () => {
    if (isScreenShare) {
      await callClient.stopScreenShare();
    } else {
      await callClient.startScreenShare();
    }
  };

  // Device selection handlers
  const handleMicMenuOpen = event => {
    event.stopPropagation();
    setMicMenuAnchor(event.currentTarget);
  };

  const handleMicMenuClose = () => {
    setMicMenuAnchor(null);
  };

  const handleCameraMenuOpen = event => {
    event.stopPropagation();
    setCameraMenuAnchor(event.currentTarget);
  };

  const handleCameraMenuClose = () => {
    setCameraMenuAnchor(null);
  };

  const handleAudioDeviceSelect = async device => {
    try {
      const success = await callClient.switchAudioDevice(device.deviceId);
      if (success) {
        setSelectedAudioDevice(device);
        dispatch(showSnackbar({ severity: 'success', message: `Switched to ${device.label}` }));
      }
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to switch microphone' }));
    }
    handleMicMenuClose();
  };

  const handleVideoDeviceSelect = async device => {
    try {
      const success = await callClient.switchVideoDevice(device.deviceId);
      if (success) {
        setSelectedVideoDevice(device);
        dispatch(showSnackbar({ severity: 'success', message: `Switched to ${device.label}` }));
      }
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to switch camera' }));
    }
    handleCameraMenuClose();
  };

  const renderButton = () => {
    return (
      <>
        <StyledButton>
          <Button
            className={`moreButton`}
            variant="contained"
            color="inherit"
            onClick={onMinimize}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            <ChatCircleDots weight="fill" size={20} />
          </Button>
          <span className={`spanTitle whiteColor`}>{t('callDirectDialog.chat')}</span>
        </StyledButton>

        <StyledButton>
          <Button
            className={`moreButton ${micOn && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
            variant="contained"
            color="inherit"
            onClick={onToggleMic}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            {micOn ? (
              <Microphone size={20} weight="fill" />
            ) : (
              <MicrophoneSlash size={20} weight="fill" color={theme.palette.error.main} />
            )}
          </Button>
          {/* Device selection arrow for microphone */}
          {callDirectStatus === CallStatus.CONNECTED && availableAudioDevices.length > 1 && (
            <Button className="deviceToggle" onClick={handleMicMenuOpen} size="small">
              <CaretDown size={14} />
            </Button>
          )}
          <span className={`spanTitle whiteColor`}>
            {micOn ? t('callDirectDialog.mute') : t('callDirectDialog.unmute')}
          </span>
        </StyledButton>

        <StyledButton>
          <Button
            className={`moreButton ${localCameraOn && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
            variant="contained"
            color="inherit"
            onClick={onToggleCamera}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            {localCameraOn ? (
              <VideoCamera weight="fill" size={20} />
            ) : (
              <VideoCameraSlash weight="fill" size={20} color={theme.palette.error.main} />
            )}
          </Button>
          {/* Device selection arrow for camera */}
          {callDirectStatus === CallStatus.CONNECTED && availableVideoDevices.length > 1 && (
            <Button className="deviceToggle" onClick={handleCameraMenuOpen} size="small">
              <CaretDown size={8} />
            </Button>
          )}
          <span className={`spanTitle whiteColor`}>
            {localCameraOn ? t('callDirectDialog.stop_video') : t('callDirectDialog.start_video')}
          </span>
        </StyledButton>

        {localCameraOn && (
          <StyledButton>
            <Button
              variant="contained"
              color={isScreenShare ? 'primary' : 'inherit'}
              onClick={onScreenShare}
              disabled={callDirectStatus !== CallStatus.CONNECTED}
            >
              <Screencast weight="fill" size={20} />
            </Button>
            <span className={`spanTitle whiteColor`}>{t('callDirectDialog.screencast')}</span>
          </StyledButton>
        )}

        {callDirectData?.type === 'incoming' && callDirectStatus === CallStatus.RINGING && (
          <>
            <StyledButton>
              <Button onClick={onSendRejectCall} variant="contained" color="error">
                <PhoneDisconnect weight="fill" size={20} />
              </Button>
              <span className={`spanTitle whiteColor`}>{t('callDirectDialog.decline')}</span>
            </StyledButton>
            <StyledButton>
              <LoadingButton onClick={onSendAcceptCall} variant="contained" color="success" loading={loadingButton}>
                <Phone weight="fill" size={20} />
              </LoadingButton>
              <span className={`spanTitle whiteColor`}>{t('callDirectDialog.accept')}</span>
            </StyledButton>
          </>
        )}

        {(callDirectData?.type === 'outgoing' || [CallStatus.CONNECTED].includes(callDirectStatus)) && (
          <StyledButton>
            <Button onClick={onSendEndCall} variant="contained" color="error">
              <PhoneDisconnect weight="fill" size={20} />
            </Button>
            <span className={`spanTitle whiteColor`}>{t('callDirectDialog.end_call')}</span>
          </StyledButton>
        )}

        {callDirectStatus === CallStatus.ERROR && (
          <StyledButton>
            <Button onClick={onCancelCall} variant="contained" color="error">
              <X weight="fill" size={20} />
            </Button>
            <span className={`spanTitle whiteColor`}>{t('callDirectDialog.cancel')}</span>
          </StyledButton>
        )}
      </>
    );
  };

  const onMinimize = () => setMinimized(true);
  const onRestore = () => setMinimized(false);

  const onToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && isFullScreen) {
        event.preventDefault();
        event.stopPropagation();
        setIsFullScreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isFullScreen]);

  return (
    <>
      <StyledCallDirectDialog
        open={openCallDirectDialog}
        TransitionComponent={Transition}
        keepMounted
        sx={{ visibility: minimized ? 'hidden' : '' }}
        isFullScreen={isFullScreen}
      >
        <DialogContent sx={{ padding: 0 }}>
          {/* Full screen toggle button - only show when connected and video call */}
          {callDirectStatus === CallStatus.CONNECTED && (localCameraOn || remoteCameraOn) && (
            <Button
              onClick={onToggleFullScreen}
              sx={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                zIndex: 4,
                minWidth: '40px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
              }}
              className={remoteCameraOn ? 'hoverShow' : ''}
            >
              {isFullScreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
            </Button>
          )}

          <Typography
            variant="body1"
            sx={{
              fontSize: '22px',
              fontWeight: 600,
              padding: '15px 40px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 3,
              transition: 'all .1s',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#fff',
            }}
            className={callDirectStatus === CallStatus.CONNECTED && remoteCameraOn ? 'hoverShow' : ''}
          >
            {user_id === callerInfo?.id ? receiverInfo?.name : callerInfo?.name}
          </Typography>

          {callDirectStatus === CallStatus.CONNECTED && !remoteMicOn && (
            <MicrophoneSlash
              weight="fill"
              size={18}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                zIndex: 2,
                color: theme.palette.error.main,
              }}
            />
          )}

          {callDirectStatus === CallStatus.CONNECTED && (
            <Typography
              variant="body1"
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                margin: '0 15px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 3,
                color: theme.palette.success.main,
              }}
            >
              {formatTime(time)}
            </Typography>
          )}

          <div className="receiverAvatar">
            <MemberAvatar
              member={
                user_id === callerInfo?.id
                  ? { name: receiverInfo?.name, avatar: receiverInfo?.avatar }
                  : { name: callerInfo?.name, avatar: callerInfo?.avatar }
              }
              width={200}
              height={200}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              fontWeight: 600,
              marginTop: '15px',
              fontSize: '14px',
              color: theme.palette.text.secondary,
            }}
          >
            {callDirectStatus === CallStatus.RINGING ? (
              t('callDirectDialog.ringing')
            ) : (
              <span style={{ color: theme.palette.success.main }}>{t('callDirectDialog.Connected')}</span>
            )}
            {[CallStatus.RINGING].includes(callDirectStatus) && (
              <>
                &nbsp;&nbsp;
                <div className="loader">
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                </div>
              </>
            )}
          </div>

          {connectionStatus && (
            <span
              style={{
                color: remoteCameraOn ? '#fff' : '#919EAB',
                position: 'absolute',
                top: '110px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                fontSize: '14px',
                width: '100%',
                padding: '0 15px',
                textAlign: 'center',
              }}
            >
              {connectionStatus}
            </span>
          )}

          <Stack
            sx={{
              width: isFullScreen ? '280px' : '150px',
              height: isFullScreen ? '200px' : '100px',
              position: 'absolute',
              bottom: '90px',
              right: '15px',
              borderRadius: '6px',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            <video
              ref={localVideoRef}
              playsInline
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: localCameraOn ? 'block' : 'none' }}
              muted
            />
          </Stack>
          <Stack
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          >
            {requestVideoCall && (
              <Stack
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  backgroundColor: '#000',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '0 15px',
                  color: '#DFE3E8',
                }}
              >
                {t('callDirectDialog.request_switch_video_call')}
              </Stack>
            )}

            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: remoteCameraOn ? 'block' : 'none',
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          className={callDirectStatus === CallStatus.CONNECTED && remoteCameraOn ? 'hoverShow' : ''}
          sx={{ justifyContent: 'center' }}
        >
          {requestVideoCall ? (
            <StyledButton>
              <LoadingButton onClick={onSwitchToVideoCall} variant="contained" color="success">
                <Phone weight="fill" size={20} />
              </LoadingButton>
              <span className={`spanTitle whiteColor`}>{t('callDirectDialog.accept')}</span>
            </StyledButton>
          ) : (
            renderButton()
          )}
        </DialogActions>
      </StyledCallDirectDialog>

      {/* Audio Device Selection Menu */}
      <StyledMenu
        anchorEl={micMenuAnchor}
        open={Boolean(micMenuAnchor)}
        onClose={handleMicMenuClose}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {availableAudioDevices.map(device => (
          <MenuItem
            key={device.deviceId}
            onClick={() => handleAudioDeviceSelect(device)}
            className={selectedAudioDevice?.deviceId === device.deviceId ? 'selected' : ''}
          >
            <ListItemText
              primaryTypographyProps={{ fontSize: '12px' }}
              primary={device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
            />
          </MenuItem>
        ))}
      </StyledMenu>

      {/* Video Device Selection Menu */}
      <StyledMenu
        anchorEl={cameraMenuAnchor}
        open={Boolean(cameraMenuAnchor)}
        onClose={handleCameraMenuClose}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {availableVideoDevices.map(device => (
          <MenuItem
            key={device.deviceId}
            onClick={() => handleVideoDeviceSelect(device)}
            className={selectedVideoDevice?.deviceId === device.deviceId ? 'selected' : ''}
          >
            <ListItemText
              primaryTypographyProps={{ fontSize: '12px' }}
              primary={device.label || `Camera ${device.deviceId.slice(0, 5)}`}
            />
          </MenuItem>
        ))}
      </StyledMenu>

      {minimized && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1500,
            borderRadius: '32px',
            padding: '10px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
          onClick={onRestore}
        >
          <MemberAvatar
            member={
              user_id === callerInfo?.id
                ? { name: receiverInfo?.name, avatar: receiverInfo?.avatar }
                : { name: callerInfo?.name, avatar: callerInfo?.avata }
            }
            width={30}
            height={30}
          />

          <span>{formatTime(time)}</span>
          <Button
            variant="contained"
            color="error"
            sx={{ minWidth: '30px', height: '30px', borderRadius: '50%', padding: 0, color: '#fff', boxShadow: 'none' }}
            onClick={event => {
              event.stopPropagation();
              onSendEndCall();
            }}
          >
            <Phone weight="fill" size={14} />
          </Button>
        </Paper>
      )}
    </>
  );
};

export default CallDirectDialog4;
