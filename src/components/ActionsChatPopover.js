import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, Button, MenuList, MenuItem, ListItemIcon, ListItemText, Popover, styled } from '@mui/material';
import Iconify from './Iconify';
import { PollIcon, ShareFileIcon } from './Icons';
import { onFilesMessage } from '../redux/slices/messages';
import { UploadType } from '../constants/commons-const';
import { setOpenCreatePollDialog } from '../redux/slices/dialog';
import { set } from 'react-hook-form';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ActionsChatPopover = ({}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { editMessage } = useSelector(state => state.messages);
  const [anchorEl, setAnchorEl] = useState(null);

  const onChangeUploadFile = (event, type) => {
    const files = Array.from(event.target.files);
    const isPhotoOrVideo = files.every(
      file => ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) || file.type.startsWith('image/'),
    );
    dispatch(onFilesMessage({ openDialog: true, files, uploadType: isPhotoOrVideo ? type : UploadType.File }));
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        sx={{ minWidth: '38px', height: '38px', borderRadius: '50%', padding: '0px' }}
        onClick={event => {
          setAnchorEl(event.currentTarget);
        }}
        disabled={Boolean(editMessage)}
      >
        <Iconify icon="ph:plus-bold" width={24} height={24} />
      </Button>

      <Popover
        id={Boolean(anchorEl) ? 'actions-chat-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuList sx={{ width: '210px' }}>
          {/* -------------------------Share File------------------------- */}
          <MenuItem component="label">
            <ListItemIcon sx={{ minWidth: 'auto!important', marginRight: '8px' }}>
              <ShareFileIcon />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }}>Share File</ListItemText>
            <VisuallyHiddenInput type="file" multiple onChange={event => onChangeUploadFile(event, UploadType.File)} />
          </MenuItem>

          {/* -------------------------Create Poll------------------------- */}
          <MenuItem
            onClick={() => {
              dispatch(setOpenCreatePollDialog(true));
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto!important', marginRight: '8px' }}>
              <PollIcon />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }}>Create Poll</ListItemText>
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
};

export default ActionsChatPopover;
