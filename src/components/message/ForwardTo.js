import { Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MessageType } from '../../constants/commons-const';
import { ArrowBendUpRight } from 'phosphor-react';

const ForwardTo = ({ message, forwardChannelName }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!message.forward_cid) return null;
  const isSticker = message.type === MessageType.Sticker;
  const color = message.isMyMessage ? theme.palette.grey[200] : theme.palette.grey[500];

  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontSize: '12px',
        color: isSticker ? '#bdbdbd' : color,
        fontWeight: 400,
      }}
    >
      <ArrowBendUpRight size={14} weight="fill" color={color} />
      &nbsp;{t('conversation.forward_from')}{' '}
      <strong>{forwardChannelName ? forwardChannelName : t('conversation.unknown_channel')}</strong>
    </Typography>
  );
};

export default ForwardTo;
