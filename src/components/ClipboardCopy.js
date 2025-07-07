import { IconButton } from '@mui/material';
import { Copy } from 'phosphor-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '../redux/slices/app';

const ClipboardCopy = ({ text }) => {
  const dispatch = useDispatch();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch(showSnackbar({ severity: 'success', message: 'Message copied to clipboard' }));
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Unable to copy the message. Please try again' }));
    }
  };
  return (
    <>
      <IconButton onClick={onCopy}>
        <Copy size={18} />
      </IconButton>
    </>
  );
};

export default ClipboardCopy;
