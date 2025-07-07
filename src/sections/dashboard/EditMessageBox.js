import React from 'react';
import { Stack, useTheme, Typography, Box, IconButton } from '@mui/material';
import { useDispatch } from 'react-redux';
import { PencilSimple, X } from 'phosphor-react';
import { onEditMessage } from '../../redux/slices/messages';

const EditMessageBox = ({ editMessage }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { messageText } = editMessage;

  return (
    <Stack direction="row" justifyContent="space-between" sx={{ padding: '15px 15px 5px' }} gap={1}>
      <Box
        sx={{
          flex: 1,
          minWidth: 'auto',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" gap={1}>
          <Box
            sx={{
              width: '2px',
              backgroundColor: theme.palette.primary.main,
            }}
          />

          <Box sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text,
                fontSize: 12,
              }}
            >
              <PencilSimple size={12} />
              <span>&nbsp;&nbsp;Edit message</span>
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[500],
                fontSize: 12,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {messageText}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <IconButton onClick={() => dispatch(onEditMessage(null))}>
        <X size={20} />
      </IconButton>
    </Stack>
  );
};

export default EditMessageBox;
