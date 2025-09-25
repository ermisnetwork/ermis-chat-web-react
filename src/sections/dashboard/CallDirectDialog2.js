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
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useDispatch, useSelector } from 'react-redux';
import { formatString } from '../../utils/commons';
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
} from 'phosphor-react';
import { Howl } from 'howler';
import { showSnackbar } from '../../redux/slices/app';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledCallDirectDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-container': {
    '& .MuiPaper-root': {
      width: '500px',
      height: '550px',
      background: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.paper,
      '&:hover .hoverShow': {
        opacity: 1,
      },
      '& .receiverAvatar': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '70px',
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
    // color: theme.palette.grey[500],
    '&.whiteColor': {
      color: '#fff',
    },
  },
}));

const CallDirectDialog2 = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const localVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
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
    dispatch(DisconnectCallDirect());
    stopRing();

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localAudioRef.current) localAudioRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (ringtone.current) {
      ringtone.current.stop();
      ringtone.current = null;
    }
  };

  // console.log(localAudioRef);
  
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

  useEffect(() => {
    if (callDirectData && callDirectStatus === CallStatus.RINGING) {
      startRing();
    }
  }, [callDirectData, callDirectStatus]);

  useEffect(() => {
    if (!callClient) return;

    callClient.onCallEvent = data => {
      dispatch(StartCallDirect(data));
      setLocalCameraOn(data.callType === CallType.VIDEO);
    };

    callClient.onLocalStream = stream => {
      // Hiển thị local video nếu có track video
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && localVideoRef.current) {
        const videoStream = new MediaStream([videoTrack]);
        localVideoRef.current.srcObject = videoStream;
      }

      // // Hiển thị local audio nếu có track audio
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && localAudioRef.current) {
        const audioStream = new MediaStream([audioTrack]);
        localAudioRef.current.srcObject = audioStream;
      }
    };

    callClient.onRemoteStream = stream => {
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (remoteVideoRef.current && videoTrack) {
        const videoStream = new MediaStream([videoTrack]);
        remoteVideoRef.current.srcObject = videoStream;
      }

      if (remoteAudioRef.current && audioTrack) {
        const audioStream = new MediaStream([audioTrack]);
        remoteAudioRef.current.srcObject = audioStream;
      }
    };

    // console.log(receiverInfo);
    
    callClient.onConnectionMessageChange = msg => {
      setConnectionStatus(msg);
    };

    callClient.onCallStatus = status => {
      dispatch(setCallDirectStatus(status));
      switch (status) {
        case CallStatus.RINGING:
          // startRing();
          break;
        case CallStatus.CONNECTED:
          startTimer();
          setLoadingButton(false);
          stopRing();
          break;
        case CallStatus.ENDED:
          onCancelCall();
          break;
        default: // CallStatus.ERROR
          onCancelCall();
          break;
      }
    };

    callClient.onDataChannelMessage = msg => {
      if (msg.type === 'transciver_state') {
        const remoteVideoEnable = msg.body.video_enable;
        const remoteAudioEnable = msg.body.audio_enable;
        setRemoteCameraOn(remoteVideoEnable);
        setRemoteMicOn(remoteAudioEnable);
      }
    };

    callClient.onUpgradeCall = user => {
      setIsUpgradeCall(true);
      if (user.id !== user_id) {
        setRequestVideoCall(true);
      }
    };

    callClient.onScreenShareChange = isShare => {
      setIsScreenShare(isShare);
    };

    callClient.onError = msg => {
      dispatch(showSnackbar({ severity: 'error', message: msg }));
    };
    // Cleanup khi unmount
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

  const onSwitchToVideoCall = () => {
    callClient.toggleCamera(!localCameraOn);
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
          <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>chat</span>
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
          <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>{micOn ? 'mute' : 'unmute'}</span>
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
          <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>
            {localCameraOn ? 'stop video' : 'start video'}
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
            <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>screencast</span>
          </StyledButton>
        )}

        {callDirectData?.type === 'incoming' && callDirectStatus === CallStatus.RINGING && (
          <>
            <StyledButton>
              <Button onClick={onSendRejectCall} variant="contained" color="error">
                <PhoneDisconnect weight="fill" size={20} />
              </Button>
              <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>decline</span>
            </StyledButton>
            <StyledButton>
              <LoadingButton onClick={onSendAcceptCall} variant="contained" color="success" loading={loadingButton}>
                <Phone weight="fill" size={20} />
              </LoadingButton>
              <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>accept</span>
            </StyledButton>
          </>
        )}

        {(callDirectData?.type === 'outgoing' || [CallStatus.CONNECTED].includes(callDirectStatus)) && (
          <StyledButton>
            <Button onClick={onSendEndCall} variant="contained" color="error">
              <PhoneDisconnect weight="fill" size={20} />
            </Button>
            <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>end call</span>
          </StyledButton>
        )}

        {callDirectStatus === CallStatus.ERROR && (
          <StyledButton>
            <Button onClick={onCancelCall} variant="contained" color="error">
              <X weight="fill" size={20} />
            </Button>
            <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>cancel</span>
          </StyledButton>
        )}
      </>
    );
  };

  const onMinimize = () => setMinimized(true);
  const onRestore = () => setMinimized(false);

  return (
    <>
      <StyledCallDirectDialog
        open={openCallDirectDialog}
        TransitionComponent={Transition}
        keepMounted
        sx={{ visibility: minimized ? 'hidden' : '' }}
      >
        <DialogContent sx={{ padding: 0 }}>
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
              color: callDirectStatus === CallStatus.CONNECTED && remoteCameraOn ? '#fff' : 'inherit',
            }}
            className={callDirectStatus === CallStatus.CONNECTED && remoteCameraOn ? 'hoverShow' : ''}
          >
            {user_id === callerInfo?.id ? formatString(receiverInfo?.name) : formatString(callerInfo?.name)}
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
              'ringing'
            ) : (
              <span style={{ color: theme.palette.success.main }}>Connected</span>
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
              width: '150px',
              height: '100px',
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
            <audio ref={localAudioRef} autoPlay muted />
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
                Request to switch to a video call
              </Stack>
            )}

            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: remoteCameraOn && !requestVideoCall ? 'block' : 'none',
              }}
            />
            <audio ref={remoteAudioRef} autoPlay />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          {requestVideoCall ? (
            <StyledButton>
              <LoadingButton onClick={onSwitchToVideoCall} variant="contained" color="success">
                <Phone weight="fill" size={20} />
              </LoadingButton>
              <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>accept</span>
            </StyledButton>
          ) : (
            renderButton()
          )}
        </DialogActions>
      </StyledCallDirectDialog>

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

export default CallDirectDialog2;
