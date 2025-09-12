import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, Stack, Typography, useTheme, IconButton, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { ChatType, RoleMember } from '../../constants/commons-const';
import { showSnackbar, UpdateIsLoading } from '../../redux/slices/app';
import { CloseAddFriendDialog } from '../../redux/slices/dialog';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { MagnifyingGlass, X } from 'phosphor-react';
import { LoadingSpinner } from '../../components/animate';
import NoResult from '../../assets/Illustration/NoResult';
import UserElement from '../../components/UserElement';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddFriendDialog = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { openAddFriendDialog } = useSelector(state => state.dialog);
  const { isLoading } = useSelector(state => state.app);
  const { user_id } = useSelector(state => state.auth);
  const { activeChannels, skippedChannels, pendingChannels } = useSelector(state => state.channel);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  const directChannels = useMemo(() => {
    return activeChannels.filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const otherMember = Object.values(channel.state.members).find(member => member.user_id !== user_id);
      return isDirect && otherMember && [RoleMember.OWNER, RoleMember.PENDING].includes(otherMember.channel_role);
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

  useEffect(() => {
    let ignore = false;
    let debounceTimer;

    if (searchQuery) {
      dispatch(UpdateIsLoading({ isLoading: true }));

      const fetchUsers = async () => {
        try {
          const name = searchQuery;
          const page = 1;
          const page_size = 10;
          const result = await client.searchUsers(page, page_size, name);

          if (!ignore) setSearchedUser(result.data[0] || null);
        } catch (e) {
          if (!ignore) setSearchedUser(null);
        } finally {
          dispatch(UpdateIsLoading({ isLoading: false }));
        }
      };

      debounceTimer = setTimeout(fetchUsers, 500);
    } else {
      setSearchedUser(null);
      dispatch(UpdateIsLoading({ isLoading: false }));
    }

    return () => {
      ignore = true;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  const onCloseAddFriendDialog = () => {
    dispatch(CloseAddFriendDialog());
  };

  const onCreateDirectChannel = async user => {
    try {
      const channel = await client.channel(ChatType.MESSAGING, {
        members: [user.id, user_id],
      });

      await channel.create();
      dispatch(showSnackbar({ severity: 'success', message: 'Invitation sent' }));
      onCloseAddFriendDialog();
    } catch (error) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to send invite. Please retry' }));
    }
  };

  const onSelectChannel = async (channel, user) => {
    const existChannel = [...directChannels, ...skippedChannels, ...pendingDirectChannels].find(
      channel => channel.state.members[user.id],
    );

    if (existChannel) {
      navigate(`${DEFAULT_PATH}/${existChannel.type}:${existChannel.id}`);
      onCloseAddFriendDialog();
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
      open={openAddFriendDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseAddFriendDialog}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {'Add Friend'}
        <IconButton onClick={onCloseAddFriendDialog}>
          <X />
        </IconButton>
      </DialogTitle>

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
            {searchQuery && searchedUser ? (
              <Stack>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '20px',
                    color: theme.palette.text.primary,
                    mb: 1,
                  }}
                >
                  {searchedUser.name.charAt(0).toUpperCase()}
                </Typography>
                <Box sx={{ marginBottom: '5px' }}>
                  <UserElement
                    user={searchedUser}
                    avatarSize={44}
                    primaryFontSize={14}
                    secondaryFontSize={12}
                    onSelect={({ channel, user }) => onSelectChannel(channel, user)}
                  />
                </Box>
              </Stack>
            ) : (
              <Stack
                sx={{
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="contained"
                  sx={{
                    fontSize: '14px',
                    padding: '5px',
                    color: theme.palette.text.secondary,
                  }}
                >
                  Search for new contact by entering their phone number or email address.
                </Typography>
                <NoResult width={160} height={300} />
                {searchQuery ? (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      textAlign: 'center',
                      fontSize: '14px',
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                    }}
                  >
                    No result {searchQuery ? `for "${searchQuery}"` : ''}
                  </Typography>
                ) : (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      textAlign: 'center',
                      fontSize: 16,
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                    }}
                  >
                    Oops! Nothing here
                  </Typography>
                )}
                <Typography
                  variant="subtitle2"
                  sx={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    marginTop: 1,
                  }}
                >
                  Looks like no one matches your search.
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
