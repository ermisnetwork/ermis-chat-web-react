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
import { formatString, getMemberInfo } from '../../utils/commons';
import { client } from '../../client';
import { ClientEvents } from '../../constants/events-const';
import { CallAction, CallStatus } from '../../constants/commons-const';
import { DisconnectCallDirect, setCallDirectStatus, setPeer } from '../../redux/slices/callDirect';
import SimplePeer from 'simple-peer';
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
import { LocalStorageKey } from '../../constants/localStorage-const';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: 'turn:36.50.62.242:3478',
    username: 'hoang',
    credential: 'pass1',
  },
];

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

const CallDirectDialog = ({ open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  // const localStreamRef = useRef(null);
  // const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const healthCallTimeoutRef = useRef(null);
  const endCallTimeoutRef = useRef(null);
  const cancelCallTimeoutRef = useRef(null);
  const missCallTimeoutRef = useRef(null);
  const healthCallOneSecondIntervalRef = useRef(null);
  const healthCallTenSecondIntervalRef = useRef(null);
  const ringtone = useRef();
  const { peer, callDirectStatus } = useSelector(state => state.callDirect);
  const { callerId, receiverId, cid, is_video, action } = useSelector(state => state.callDirect.callDirectData);
  const { all_members } = useSelector(state => state.member);
  const { user_id } = useSelector(state => state.auth);

  const [localStream, setLocalStream] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [time, setTime] = useState(0);
  const [loadingButton, setLoadingButton] = useState(false);
  const [signalOffer, setSignalOffer] = useState(null);
  const [signalIce, setSignalIce] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [errorText, setErrorText] = useState('');
  const [localCameraOn, setLocalCameraOn] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);
  const [requestVideoCall, setRequestVideoCall] = useState(false);
  const [isUpgradeCall, setIsUpgradeCall] = useState(false);
  const [localIsOnline, setLocalIsOnline] = useState(true);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [screenStream, setScreenStream] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const sessionId = localStorage.getItem(LocalStorageKey.SessionId) || `cb1a4db8-33f0-43dd-a48a-${user_id.slice(-12)}`;

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const sendSignalData = async payload => {
    try {
      return await client.startCall({ ...payload, session_id: sessionId, ios: false });
    } catch (error) {
      const action = payload.action;
      if (error.code === 'ERR_NETWORK') {
        // mât mạng
        if (action === CallAction.CREATE_CALL) {
          dispatch(setCallDirectStatus(CallStatus.ERROR));
          setErrorText('Unable to make the call. Please check your network connection');
        }
      } else {
        dispatch(setCallDirectStatus(CallStatus.ERROR));
        if (error.response.data.ermis_code === 20) {
          setErrorText('Recipient was busy');
          throw new Error('Recipient was busy');
        } else {
          setErrorText('Call Failed');
        }
      }
    }
  };

  const onSendCreateCall = async () => {
    const payload = {
      action,
      cid,
      is_video,
    };
    const response = await sendSignalData(payload);

    if (response) {
      dispatch(setCallDirectStatus(CallStatus.CONNECTING));
    }
  };

  const onSendHealthCall = async () => {
    const payload = {
      action: CallAction.HEALTH_CALL,
      cid,
    };
    await sendSignalData(payload);
  };

  const onSendUpgradeCall = async () => {
    const payload = {
      action: CallAction.UPGRADE_CALL,
      cid,
    };
    await sendSignalData(payload);
  };

  const onSendMissCall = async () => {
    const payload = {
      action: CallAction.MISS_CALL,
      cid,
    };
    const response = await sendSignalData(payload);
    if (response) {
      onCancelCall();
    }
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRing = () => {
    ringtone.current = new Howl({
      src: ['/ringtone.mp3'],
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
    if (callerId && receiverId) {
      setCallerInfo(getMemberInfo(callerId, all_members));
      setReceiverInfo(getMemberInfo(receiverId, all_members));
    }
  }, [callerId, receiverId, all_members]);

  useEffect(() => {
    if ([CallStatus.CONNECTING, CallStatus.RINGING].includes(callDirectStatus)) {
      startRing();

      // Thiết lập timeout sau 60 giây sẽ gửi miss-call
      missCallTimeoutRef.current = setTimeout(() => {
        onSendMissCall();
      }, 60000);
    } else {
      stopRing();
      clearTimeout(missCallTimeoutRef.current);
    }

    return () => {
      stopRing();
      clearTimeout(missCallTimeoutRef.current);
    };
  }, [callDirectStatus]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setLocalStream(stream);
      // if (localStreamRef.current) {
      //   localStreamRef.current.srcObject = stream;
      // }

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

      // if (!is_video) {
      //   stream.getTracks().forEach(track => track.stop());
      //   navigator.mediaDevices.getUserMedia({ audio: true });
      // }
    });
  }, []);

  const onSetSignalIce = signal => {
    const sdp = `${signal.candidate.sdpMid}$${signal.candidate.sdpMLineIndex}$${signal.candidate.candidate}`;
    const obj = { type: 'ice', sdp };
    setSignalIce(prev => [...prev, obj]);
  };

  const onSetSignalOffer = signal => {
    setSignalOffer(signal);
  };

  const onClearRef = () => {
    clearTimeout(healthCallTimeoutRef.current);
    clearTimeout(endCallTimeoutRef.current);
    clearTimeout(missCallTimeoutRef.current);
    clearTimeout(cancelCallTimeoutRef.current);
    clearInterval(healthCallOneSecondIntervalRef.current);
    clearInterval(healthCallTenSecondIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    // localStreamRef.current = null;
    // remoteStreamRef.current = null;
    remoteVideoRef.current = null;
    remoteAudioRef.current = null;
    localVideoRef.current = null;
    localAudioRef.current = null;
  };

  // const onSwitchToVideoCall = () => {
  //   navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(newStream => {
  //     // Thay thế track hiện tại bằng track mới
  //     const videoTrack = newStream.getVideoTracks()[0]; // Lấy video track
  //     const audioTrack = newStream.getAudioTracks()[0]; // Lấy audio track

  //     console.log('------videoTrack-----', videoTrack);
  //     console.log('------audioTrack-----', audioTrack);

  //     // Thay thế từng track nếu tồn tại
  //     if (peer) {
  //       console.log('----peer.getSenders()---', peer._pc.getSenders());

  //       const sender = peer._pc.getSenders().find(s => s.track?.kind === 'audio');
  //       console.log('----sender---', sender);

  //       if (sender) sender.replaceTrack(videoTrack);

  //       // if (videoTrack) {
  //       //   const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video');
  //       //   if (sender) sender.replaceTrack(videoTrack);
  //       // }
  //       // if (audioTrack) {
  //       //   const sender = peer._pc.getSenders().find(s => s.track?.kind === 'audio');
  //       //   if (sender) sender.replaceTrack(audioTrack);
  //       // }
  //     }

  //     // setLocalStream(newStream);
  //     if (localStreamRef.current) {
  //       localStreamRef.current.srcObject = newStream;
  //     }

  //     // Hiển thị local video nếu có track video
  //     if (videoTrack && localVideoRef.current) {
  //       const videoStream = new MediaStream([videoTrack]);
  //       localVideoRef.current.srcObject = videoStream;
  //     }
  //     // // Hiển thị local audio nếu có track audio
  //     if (audioTrack && localAudioRef.current) {
  //       const audioStream = new MediaStream([audioTrack]);
  //       localAudioRef.current.srcObject = audioStream;
  //     }
  //   });
  // };

  const createPeer = (initiator, stream) => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: ICE_SERVERS,
      },
      channelName: 'rtc_data_channel',
      allowHalfTrickle: true,
    });

    // stream?.getTracks().forEach(track => {
    //   peer.addTrack(track, stream);
    // });

    peer.on('connect', () => {
      const jsonData = {
        type: 'transciver_state',
        body: {
          audio_enable: true,
          video_enable: is_video,
        },
      };

      peer.send(JSON.stringify(jsonData));

      const onConnectCall = async () => {
        const payload = {
          action: CallAction.CONNECT_CALL,
          cid,
          is_video,
        };
        const response = await sendSignalData(payload);

        if (response) {
          startTimer();
          dispatch(setCallDirectStatus(CallStatus.CONNECTED));
          setLoadingButton(false);
        }
      };
      onConnectCall();
    });

    peer.on('data', data => {
      const message = JSON.parse(data);

      if (message.type === 'transciver_state') {
        const remoteVideoEnable = message.body.video_enable;
        const remoteAudioEnable = message.body.audio_enable;
        setRemoteCameraOn(remoteVideoEnable);
        setRemoteMicOn(remoteAudioEnable);
      }
    });

    peer.on('track', (track, remoteStream) => {
      // if (remoteStreamRef.current) {
      //   remoteStreamRef.current.srcObject = remoteStream; // Cập nhật video của đối tác
      // }

      if (track.kind === 'video' && remoteVideoRef.current) {
        const videoStream = new MediaStream([track]);
        remoteVideoRef.current.srcObject = videoStream; // Thêm video stream
      } else if (track.kind === 'audio' && remoteAudioRef.current) {
        const audioStream = new MediaStream([track]);
        remoteAudioRef.current.srcObject = audioStream; // Thêm audio stream
      }
    });

    // peer.on('close', () => {
    //   onSendEndCall();
    // });

    peer.on('error', err => {
      console.log('Error occurred:------', err);
    });

    return peer;
  };

  useEffect(() => {
    setLocalCameraOn(is_video);
    // setRemoteCameraOn(is_video);

    if (callDirectStatus === CallStatus.IDLE && localStream) {
      const peerCaller = createPeer(true, localStream);
      dispatch(setPeer(peerCaller));

      peerCaller.on('signal', signal => {
        if (signal.type === 'candidate') {
          onSetSignalIce(signal);
        } else {
          onSetSignalOffer(signal);
        }
      });

      onSendCreateCall();
    }
  }, [dispatch, callDirectStatus, is_video, localStream]);

  useEffect(() => {
    const handleCall = async event => {
      const { action, user_id: eventUserId, session_id: eventSessionId, cid, is_video, signal } = event;
      switch (action) {
        case CallAction.ACCEPT_CALL:
          if (eventUserId !== user_id) {
            // event này do receiver gửi, caller nhận được action ACCEPT_CALL thì sẽ gửi signal type offer cho receiver
            const onSendAcceptCall = async () => {
              const payload = {
                action: CallAction.SIGNAL_CALL,
                cid: event.cid,
                is_video: event.is_video,
                signal: signalOffer,
              };
              await sendSignalData(payload);
            };

            onSendAcceptCall();
          } else {
            if (eventSessionId !== sessionId) {
              onCancelCall();
            }
          }
          break;

        case CallAction.SIGNAL_CALL:
          if (eventUserId === user_id) return;

          if (signal.type === 'answer') {
            // event này do receiver gửi, caller nhận được signal type answer và thiết lập kết nối
            peer.signal(signal);
            if (signalIce.length) {
              await Promise.all(
                signalIce.map(candidate =>
                  sendSignalData({
                    action: CallAction.SIGNAL_CALL,
                    cid,
                    is_video,
                    signal: candidate,
                  }),
                ),
              );
            }
          } else if (signal.type === 'ice') {
            // event này do receiver gửi, caller nhận được signal type ice và thiết lập kết nối
            const splitSdp = signal.sdp.split('$');
            peer.signal({
              candidate: {
                candidate: splitSdp[2],
                sdpMLineIndex: Number(splitSdp[1]),
                sdpMid: splitSdp[0],
              },
              type: 'candidate',
            });
          } else if (signal.type === 'offer') {
            // event này do caller gửi, receiver nhận được signal type offer sẽ tạo peer và gửi signal type ice và signal type answer cho caller
            const peerReceiver = createPeer(false, localStream);
            dispatch(setPeer(peerReceiver));

            peerReceiver.on('signal', async sig => {
              let newSignal;
              if (sig.type === 'candidate') {
                const sdp = `${sig.candidate.sdpMid}$${sig.candidate.sdpMLineIndex}$${sig.candidate.candidate}`;
                newSignal = { type: 'ice', sdp };
              } else if (sig.type === 'answer') {
                newSignal = sig;
              }

              if (newSignal) {
                await sendSignalData({
                  action: CallAction.SIGNAL_CALL,
                  cid,
                  is_video,
                  signal: newSignal,
                });
              }
            });
            peerReceiver.signal(signal);
          }
          break;

        case CallAction.END_CALL:
        case CallAction.REJECT_CALL:
        case CallAction.MISS_CALL:
          onCancelCall();
          if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setIsScreenShare(false);
          }
          break;
      }
    };

    const handleConnectionChanged = ({ online }) => {
      if (!online) {
        setLocalIsOnline(false);
      } else {
        setLocalIsOnline(true);
      }
    };

    client.on(ClientEvents.Signal, handleCall);
    client.on(ClientEvents.ConnectionChanged, handleConnectionChanged);
    return () => {
      client.off(ClientEvents.Signal, handleCall);
      client.off(ClientEvents.ConnectionChanged, handleConnectionChanged);
    };
  }, [dispatch, client, signalOffer, signalIce, peer, localStream, screenStream, user_id, sessionId]);

  useEffect(() => {
    if (callDirectStatus === CallStatus.CONNECTED) {
      if (localIsOnline) {
        setConnectionStatus('');

        // Gửi health_call mỗi giây qua peer
        healthCallOneSecondIntervalRef.current = setInterval(() => {
          if (peer) {
            peer.send(JSON.stringify({ type: 'health_call' }));
          }
        }, 1000);

        // Gửi health_call mỗi 10 giây qua server
        healthCallTenSecondIntervalRef.current = setInterval(() => {
          onSendHealthCall();
        }, 10000);

        // Nhận data health_call ở đây để biết mình đang online hay offline, nếu nhận ở trên hàm createPeer thì ko phân biệt được là mình đang online hay offline
        peer.on('data', data => {
          const message = JSON.parse(data);

          if (message.type === 'health_call') {
            setConnectionStatus('');

            // Xóa các timeout hiện tại nếu nhận được health_call
            clearTimeout(healthCallTimeoutRef.current);
            clearTimeout(endCallTimeoutRef.current);
            // Đặt timeout để kiểm tra nếu không nhận health_call trong 3 giây
            healthCallTimeoutRef.current = setTimeout(() => {
              setConnectionStatus(
                `${user_id === callerInfo?.id ? receiverInfo?.name : callerInfo?.name} network connection is unstable`,
              );

              // Đặt timeout để kiểm tra nếu không nhận health_call trong 30 giây
              endCallTimeoutRef.current = setTimeout(() => {
                onSendEndCall();
              }, 30000);
            }, 3000);
          }
        });
      } else {
        setConnectionStatus('Your network connection is unstable');
        cancelCallTimeoutRef.current = setTimeout(() => {
          onCancelCall();
        }, 30000);
      }

      // Clear intervals khi component bị hủy
      return () => {
        clearInterval(healthCallOneSecondIntervalRef.current);
        clearInterval(healthCallTenSecondIntervalRef.current);
        clearTimeout(cancelCallTimeoutRef.current);
        clearTimeout(endCallTimeoutRef.current);
        clearTimeout(healthCallTimeoutRef.current);
      };
    }
  }, [localIsOnline, callDirectStatus, peer, user_id, callerInfo, receiverInfo]);

  useEffect(() => {
    const handleUpgradeCall = event => {
      if (event.cid === cid) {
        setIsUpgradeCall(true);

        if (event.user.id !== user_id) {
          setRequestVideoCall(true);
        }
      }
    };

    client.on(ClientEvents.MessageUpdated, handleUpgradeCall);
    return () => {
      client.off(ClientEvents.MessageUpdated, handleUpgradeCall);
    };
  }, [client, cid, user_id]);

  const onSendAcceptCall = async () => {
    const payload = {
      cid,
      action: CallAction.ACCEPT_CALL,
      is_video,
    };
    setLoadingButton(true);
    const response = await sendSignalData(payload);
    if (response) {
      stopRing();
    }
  };

  const onSendEndCall = async () => {
    const payload = {
      cid,
      action: CallAction.END_CALL,
    };
    const response = await sendSignalData(payload);

    if (response) {
      onCancelCall();
    }
  };

  const onSendRejectCall = async () => {
    const payload = {
      cid,
      action: CallAction.REJECT_CALL,
    };
    const response = await sendSignalData(payload);

    if (response) {
      onCancelCall();
    }
  };

  const onCancelCall = () => {
    if (peer) {
      peer.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    dispatch(DisconnectCallDirect());
    onClearRef();
  };

  const onToggleLocalCamera = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localCameraOn;

      setLocalCameraOn(!localCameraOn);

      const jsonData = {
        type: 'transciver_state',
        body: {
          audio_enable: true,
          video_enable: !localCameraOn,
        },
      };
      if (peer) peer.send(JSON.stringify(jsonData));
    }
  };

  const onSwitchToVideoCall = () => {
    onToggleLocalCamera();
    setRequestVideoCall(false);
  };

  const onToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);

      const jsonData = {
        type: 'transciver_state',
        body: {
          audio_enable: !micOn,
          video_enable: localCameraOn,
        },
      };
      if (peer) peer.send(JSON.stringify(jsonData));
    }
  };

  const onToggleCamera = () => {
    onToggleLocalCamera();
    if (!is_video && !isUpgradeCall) {
      onSendUpgradeCall();
    }
  };

  const onScreenShare = () => {
    if (isScreenShare) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      onStopScreenShare();
    } else {
      navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
        const screenTrack = stream.getVideoTracks()[0];

        peer.replaceTrack(peer.streams[0].getVideoTracks()[0], screenTrack, peer.streams[0]);
        setIsScreenShare(true);
        setScreenStream(stream);

        if (screenTrack && localVideoRef.current) {
          const videoStream = new MediaStream([screenTrack]);
          localVideoRef.current.srcObject = videoStream;
        }

        screenTrack.onended = () => {
          stream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
          onStopScreenShare();
        };
      });
    }
  };

  const onStopScreenShare = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    peer.replaceTrack(peer.streams[0].getVideoTracks()[0], videoTrack, peer.streams[0]);
    setIsScreenShare(false);

    if (videoTrack && localVideoRef.current) {
      const videoStream = new MediaStream([videoTrack]);
      localVideoRef.current.srcObject = videoStream;
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
              className={`moreButton ${isScreenShare && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
              variant="contained"
              color="inherit"
              onClick={onScreenShare}
              disabled={callDirectStatus !== CallStatus.CONNECTED}
            >
              <Screencast weight="fill" size={20} />
            </Button>
            <span className={`spanTitle ${remoteCameraOn ? 'whiteColor' : ''}`}>screencast</span>
          </StyledButton>
        )}

        {callDirectStatus === CallStatus.RINGING && (
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

        {[CallStatus.IDLE, CallStatus.CONNECTING, CallStatus.CONNECTED].includes(callDirectStatus) && (
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
        open={open}
        TransitionComponent={Transition}
        keepMounted
        sx={{ visibility: minimized ? 'hidden' : 'visible' }}
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
                  : { name: callerInfo?.name, avatar: callerInfo?.avata }
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
            {callDirectStatus === CallStatus.IDLE ? (
              'Waiting'
            ) : callDirectStatus === CallStatus.CONNECTING ? (
              'Connecting'
            ) : callDirectStatus === CallStatus.RINGING ? (
              'is calling you'
            ) : callDirectStatus === CallStatus.CONNECTED ? (
              <span style={{ color: theme.palette.success.main }}>Connected</span>
            ) : (
              <span style={{ color: theme.palette.error.main }}>{errorText}</span>
            )}
            {[CallStatus.IDLE, CallStatus.CONNECTING, CallStatus.RINGING].includes(callDirectStatus) && (
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
              // visibility: localCameraOn ? 'visible' : 'hidden',
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
              // visibility: remoteCameraOn ? 'visible' : 'hidden',
              backgroundColor: requestVideoCall ? '#000' : 'transparent',
            }}
          >
            {requestVideoCall && (
              <span
                style={{
                  color: '#DFE3E8',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  fontSize: '14px',
                  width: '100%',
                  padding: '0 15px',
                  textAlign: 'center',
                }}
              >
                Request to switch to a video call
              </span>
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

export default CallDirectDialog;
