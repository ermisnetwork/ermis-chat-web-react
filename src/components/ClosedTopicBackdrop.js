import { Box, useTheme, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { handleError, myRoleInChannel } from '../utils/commons';
import { RoleMember } from '../constants/commons-const';
import { PlayCircleIcon } from './Icons';
import { showSnackbar } from '../redux/slices/app';
import { useTranslation } from 'react-i18next';

export default function ClosedTopicBackdrop() {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const myRole = myRoleInChannel(currentChannel);

  const onReopenTopic = async () => {
    try {
      const topicCID = currentTopic?.cid;
      await currentChannel.reopenTopic(topicCID);
      dispatch(showSnackbar({ message: t('closedTopicBackdrop.snackbar_success'), severity: 'success' }));
    } catch (error) {
      handleError(dispatch, error, t);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '77px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px 24px',
      }}
    >
      {[RoleMember.OWNER, RoleMember.MODERATOR].includes(myRole) ? (
        <Button
          size="large"
          variant="text"
          startIcon={<PlayCircleIcon color={theme.palette.text.primary} />}
          sx={{
            fontSize: '14px',
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[5],
            borderRadius: '16px',
            minWidth: '350px',
          }}
          onClick={onReopenTopic}
        >
          {t('closedTopicBackdrop.message')}
        </Button>
      ) : (
        <Typography
          variant="body1"
          sx={{ color: theme.palette.error.main, fontWeight: 600, textAlign: 'center', fontSize: '14px' }}
        >
          {t('closedTopicBackdrop.title')}
        </Typography>
      )}
    </Box>
  );
}
