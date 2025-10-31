import React from 'react';
import { Button, Stack, Typography, Box, useTheme } from '@mui/material';
import NoChat from '../../assets/Illustration/NoChat';
import { useDispatch, useSelector } from 'react-redux';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../../redux/slices/dialog';
import useResponsive from '../../hooks/useResponsive';
import { NewChatIcon, PeopleIcon } from '../../components/Icons';
import { NewChat_Menu } from '../../data';
import { useTranslation } from 'react-i18next';
const GeneralApp = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobileToMd = useResponsive('down', 'md');

  if (isMobileToMd) return null;

  const handleMenuItem = key => {
    switch (key) {
      case 'new_channel':
        dispatch(OpenDialogCreateChannel());
        break;
      case 'new_message':
        dispatch(OpenDialogNewDirectMessage());
        break;
      default:
        break;
    }
  };
  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        // backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        borderRadius: '16px',
        minWidth: 'auto',
        flex: 1,
      }}
    >
      <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
        <NoChat />
        <Typography variant="h4" sx={{ textAlign: 'center' }}>
          {t('channel.message_large')}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
          {t('channel.message_small')}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ marginTop: '15px' }}>
          {NewChat_Menu.map(item => (
            <Button 
              key={item.key}
              variant="outlined" 
              size="large" 
              onClick={() => handleMenuItem(item.key)}
              sx={{ gap: 1 }}
            >
              {item.icon}
              {t(item.title)}
            </Button>
          ))}
          {/* <Button 
            variant="outlined" 
            size="large" onClick={() => dispatch(OpenDialogCreateChannel())} sx={{ gap: 1 }}>
            <PeopleIcon size={24} color={theme.palette.text.primary} />
            {NewChat_Menu[0].title}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => dispatch(OpenDialogNewDirectMessage())}
            sx={{ gap: 1 }}
          >
            <NewChatIcon size={24} color={theme.palette.text.primary} />
            NEW MESSAGE
          </Button> */}
        </Stack>
      </Stack>
    </Box>
  );
};

export default GeneralApp;
