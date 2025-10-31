import React from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, List, ListItem, ListItemText } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { SetMessagesHistoryDialog } from '../../redux/slices/dialog';
import { fDateTime } from '../../utils/formatTime';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MessagesHistoryDialog = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { messagesHistoryDialog } = useSelector(state => state.dialog);
  const { openDialog, messages } = messagesHistoryDialog;

  const onCloseDialog = () => {
    dispatch(SetMessagesHistoryDialog({ openDialog: false, messages: [] }));
  };

  return (
    <Dialog
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '350px',
          },
        },
      }}
    >
      <DialogTitle>{t('messagesHistoryDialog.title')}</DialogTitle>
      <DialogContent sx={{ maxHeight: '250px' }} className="customScrollbar">
        <List>
          {messages.map((msg, index) => {
            return (
              <ListItem key={index}>
                <ListItemText primary={msg.text} secondary={fDateTime(msg.created_at)} />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesHistoryDialog;
