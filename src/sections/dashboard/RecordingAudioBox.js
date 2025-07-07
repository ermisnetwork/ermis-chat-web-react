import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Stack, useTheme, Typography, Box, IconButton, keyframes, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../../redux/slices/app';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';
import { LoadingSpinner } from '../../components/animate';
import { ElipseStopRecordIcon, SendIcon } from '../../components/Icons';
import Iconify from '../../components/Iconify';
import { onSetAttachmentsMessage } from '../../redux/slices/messages';

const blink = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 0.2; }
  100% { opacity: 1; }
`;

const zoom = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const RecordingAudioBox = React.forwardRef((props, ref) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const streamRef = useRef(null);
  const { currentChannel } = useSelector(state => state.channel);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioMeta, setAudioMeta] = useState(null);

  useEffect(() => {
    cancelRecording();
  }, [currentChannel]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (audioFile && !isRecording) {
      uploadAudioFile();
    }
  }, [audioFile, isRecording]);

  useEffect(() => {
    if (audioUrl && audioMeta && audioFile) {
      const attachment = {
        loading: false,
        type: 'voiceRecording',
        name: audioFile.name,
        size: audioFile.size,
        error: false,
        url: audioUrl,
        message: '',
        waveform_data: audioMeta.waveform_data || [],
        duration: audioMeta.duration || 0,
      };
      dispatch(onSetAttachmentsMessage([attachment]));
    }
  }, [audioFile, audioUrl, audioMeta]);

  const formatTime = seconds => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const uploadAudioFile = async () => {
    try {
      setAudioUploading(true);
      const response = await currentChannel.sendFile(audioFile);
      setAudioUrl(response.file);
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Upload audio failed' }));
    } finally {
      setAudioUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new window.MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/aac' });
        const file = new File([blob], `audio_${Date.now()}.aac`, { type: 'audio/aac' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Cannot access microphone' }));
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setAudioUrl(null);
    setAudioFile(null);
    setMediaRecorder(null);
    setRecordingTime(0);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    dispatch(onSetAttachmentsMessage([]));
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useImperativeHandle(ref, () => ({
    startRecording,
    cancelRecording,
  }));

  return (
    <>
      {isRecording && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '0px',
            right: '90px',
            zIndex: 1,
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.background.neutral,
            paddingLeft: '10px',
            height: '47px',
            borderRadius: '30px',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              right: '-90px',
              top: '0px',
              width: '100px',
              height: '100%',
              borderRadius: '30px',
              background: theme.palette.background.neutral,
              opacity: 0.7,
            },
          }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: theme.palette.error.main,
                animation: `${blink} 2s infinite`,
              }}
            />

            <Typography variant="body2" sx={{ fontSize: '14px' }}>
              {formatTime(recordingTime)}
            </Typography>
          </Stack>

          <Box sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <Button variant="text" color="info" onClick={cancelRecording}>
              CANCEL
            </Button>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '-6px', left: '-6px', animation: `${zoom} 2s ease-in-out infinite` }}>
              <ElipseStopRecordIcon />
            </Box>

            <Button
              variant="contained"
              color="error"
              sx={{ borderRadius: '50%', minWidth: '60px', height: '60px', padding: 0 }}
              onClick={stopRecording}
            >
              <SendIcon color="#fff" style={{ transform: 'rotate(45deg)', marginRight: '5px' }} />
            </Button>
          </Box>
        </Stack>
      )}

      {audioUrl && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '0px',
            right: '60px',
            zIndex: 1,
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.background.neutral,
            paddingLeft: '5px',
            height: '47px',
            borderRadius: '30px',
          }}
        >
          <IconButton onClick={cancelRecording} color="error">
            <Iconify icon="humbleicons:trash" />
          </IconButton>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{
              flex: 1,
              overflow: 'hidden',
              minWidth: 'auto',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '30px',
              height: '38px',
            }}
          >
            <CustomAudioPlayer
              src={audioUrl}
              onLoaded={({ duration, waveform_data }) => setAudioMeta({ duration, waveform_data })}
            />
          </Stack>
        </Stack>
      )}

      {audioUploading && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '0px',
            right: '0px',
            zIndex: 1,
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.background.neutral,
            height: '47px',
            borderRadius: '30px',
          }}
        >
          <LoadingSpinner size={20} color={theme.palette.primary.main} />
        </Stack>
      )}
    </>
  );
});

export default RecordingAudioBox;
