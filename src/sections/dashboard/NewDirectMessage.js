import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { ChatType, RoleMember } from '../../constants/commons-const';
import { showSnackbar } from '../../redux/slices/app';
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
  const { activeChannels, skippedChannels, pendingChannels } = useSelector(state => state.channel);
  const [searchQuery, setSearchQuery] = useState('');

  // invitedChannels: các channel direct mà bạn đã gửi lời mời, đối phương chưa xác nhận tham gia.
  const invitedChannels = useMemo(() => {
    return activeChannels.filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const otherMember = Object.values(channel.state.members).find(member => member.user_id !== user_id);
      return isDirect && otherMember && otherMember.channel_role === RoleMember.PENDING;
    });
  }, [activeChannels, user_id]);

  // pendingDirectChannels: các channel direct mà người dùng đã gửi lời mời cho bạn, bạn chưa xác nhận tham gia.
  const pendingDirectChannels = useMemo(() => {
    return pendingChannels.filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const myMember = channel.state.members[user_id];
      return isDirect && myMember && myMember.channel_role === RoleMember.PENDING;
    });
  }, [pendingChannels, user_id]);

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
      onCloseDialogNewDirectMessage();
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to send invite. Please retry' }));
    }
  };

  const onSelectChannel = async (channel, user) => {
    const existChannel = [...invitedChannels, ...skippedChannels, ...pendingDirectChannels].find(
      channel => channel.state.members[user.id],
    );

    if (channel || existChannel) {
      const channelId = channel ? channel.id : existChannel.id;
      const channelType = channel ? channel.type : existChannel.type;
      navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
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
