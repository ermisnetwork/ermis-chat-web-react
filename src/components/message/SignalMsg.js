import React from 'react';
import { 
    Box, 
    Stack, 
    Typography,
    useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DateLine from './DateLine';
import { Phone, VideoCamera } from 'phosphor-react';
import { convertMessageSignal } from '../../utils/messageSignal';
import { CallType } from '../../constants/commons-const';

const SignalMsg = ({ message }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const msg = convertMessageSignal(message.text, t);

  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: message.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          // display: 'flex',
          // alignItems: 'center',
          maxWidth: '100%',
        }}
      >
        <Stack direction="row" alignItems="center">
          {msg?.callType === CallType.VIDEO ? (
            <VideoCamera size={22} weight="fill" color={msg.color ? msg.color : theme.palette.grey[500]} />
          ) : (
            <Phone size={22} weight="fill" color={msg.color ? msg.color : theme.palette.grey[500]} />
          )}
          <Typography
            variant="body2"
            color={message.isMyMessage ? '#fff' : theme.palette.text}
            sx={{ wordBreak: 'break-word', paddingLeft: '10px' }}
          >
            {t(msg?.text)}

            {msg?.duration && <span style={{ display: 'block', color: theme.palette.grey[500] }}>{msg?.duration}</span>}
          </Typography>
        </Stack>
        <DateLine date={message.created_at} isEdited={false} isMyMessage={message.isMyMessage} />
      </Box>
    </Stack>
  );
};
export default SignalMsg;