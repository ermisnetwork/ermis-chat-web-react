import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import ChannelAvatar from './ChannelAvatar';
import { formatString } from '../utils/commons';
import { onEditMessage, onReplyMessage } from '../redux/slices/messages';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../config';
import { UpdateTab } from '../redux/slices/app';
import { TabType } from '../constants/commons-const';

const StyledChatBox = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '8px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    '& .optionsMore': {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    '& .optionsNoti': {
      display: 'none',
    },
  },
}));

const ContactElement = ({ channel }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const channelId = channel.data.id;
  const channelType = channel.data.type;

  const onLeftClick = () => {
    navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
    dispatch(onReplyMessage(null));
    dispatch(onEditMessage(null));
    dispatch(UpdateTab({ tab: TabType.Chat }));
  };

  return (
    <StyledChatBox
      onClick={onLeftClick}
      sx={{
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
        padding: '10px',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" sx={{ width: '100%', alignItems: 'center', paddingRight: '8px' }}>
          <Stack sx={{ width: '40px' }}>
            <ChannelAvatar channel={channel} width={40} height={40} />
          </Stack>

          <Stack sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}>
            <Typography
              variant="subtitle2"
              sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span
                style={{
                  width: `100%`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatString(channel.data.name)}
              </span>
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

export default ContactElement;
