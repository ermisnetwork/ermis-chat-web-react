import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const options = [
  {
    label: 'Mute for 15 minutes',
    value: '900000',
  },
  {
    label: 'Mute for 1 hour',
    value: '3600000',
  },
  {
    label: 'Mute for 8 hours',
    value: '28800000',
  },
  {
    label: 'Until i turn it back on',
    value: 'null',
  },
];

const defaultDuration = {
  label: 'Mute for 15 minutes',
  value: '900000',
};

const ChannelNotificationDialog = ({ openDialogMuted, setOpenDialogMuted }) => {
  const { currentChannel } = useSelector(state => state.channel);

  const [duration, setDuration] = useState(defaultDuration);

  const onCloseDialog = () => {
    setOpenDialogMuted(false);
    setDuration(defaultDuration);
  };

  const onSubmit = async () => {
    await currentChannel.muteNotification(duration.value === 'null' ? null : Number(duration.value));
  };

  const onChangeDuration = event => {
    const value = event.target.value;
    const option = options.find(item => item.value === value);
    setDuration(option);
  };

  if (!currentChannel) return null;

  return (
    <Dialog
      open={openDialogMuted}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '350px',
          },
          '& .MuiDialogTitle-root': {
            padding: '16px 24px',
          },
          '& .MuiDialogActions-root': {
            padding: '0 24px 16px',
          },
        },
      }}
    >
      <DialogTitle>Mute Notifications</DialogTitle>
      <DialogContent>
        <FormControl>
          <RadioGroup name="duration-group" value={duration.value} onChange={onChangeDuration}>
            {options.map(option => (
              <FormControlLabel value={option.value} key={option.value} control={<Radio />} label={option.label} />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>Cancel</Button>
        <LoadingButton onClick={onSubmit}>Accept</LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ChannelNotificationDialog;
