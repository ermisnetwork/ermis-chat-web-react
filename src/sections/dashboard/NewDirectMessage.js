import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { ChatType } from '../../constants/commons-const';
import { SetSearchQuery, showSnackbar } from '../../redux/slices/app';
import { CloseDialogNewDirectMessage } from '../../redux/slices/dialog';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { MagnifyingGlass } from 'phosphor-react';
import FriendList from './FriendList';
import { LoadingSpinner } from '../../components/animate';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const NewDirectMessage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDialogNewDirectMessage } = useSelector(state => state.dialog);
  const { isLoading } = useSelector(state => state.app);
  const { user_id } = useSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const onCloseDialogNewDirectMessage = () => {
    dispatch(CloseDialogNewDirectMessage());
  };

  const onCreateDirectChannel = async user => {
    try {
      const channel = await client.channel(ChatType.MESSAGING, {
        members: [user.id, user_id],
      });

      await channel.create();
      dispatch(showSnackbar({ severity: 'success', message: 'Invitation sent' }));
      dispatch(SetSearchQuery(''));
      onCloseDialogNewDirectMessage();
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to send invite. Please retry' }));
    }
  };

  const onSelectChannel = async (channel, user) => {
    if (channel) {
      navigate(`${DEFAULT_PATH}/${channel.type}:${channel.id}`);
      dispatch(SetSearchQuery(''));
      onCloseDialogNewDirectMessage();
      return;
    } else if (user) {
      onCreateDirectChannel(user);
      return;
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialogNewDirectMessage}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialogNewDirectMessage}
    >
      <DialogTitle>{'Start a new conversation'}</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        <Stack spacing={3}>
          <Search>
            <SearchIconWrapper>
              {isLoading ? <LoadingSpinner size={18} /> : <MagnifyingGlass size={18} />}
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ height: '48px' }}
              autoFocus
            />
          </Search>

          <Stack
            className="customScrollbar"
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              height: '450px',
              marginRight: '-15px!important',
              paddingRight: '12px',
            }}
          >
            <FriendList
              searchQuery={searchQuery}
              enableUserSearch
              onSelect={({ channel, user }) => onSelectChannel(channel, user)}
            />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default NewDirectMessage;
