import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Slide, Stack, Chip, alpha, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { SetOpenInviteFriendDialog } from '../../redux/slices/dialog';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { MagnifyingGlass } from 'phosphor-react';
import FriendList from './FriendList';
import { LoadingButton } from '@mui/lab';
import MemberAvatar from '../../components/MemberAvatar';
import { AvatarShape } from '../../constants/commons-const';
import { showSnackbar } from '../../redux/slices/app';
import { handleError } from '../../utils/commons';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const InviteFriendDialog = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { openInviteFriendDialog } = useSelector(state => state.dialog);
  const { currentChannel } = useSelector(state => state.channel);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingButton, setLoadingButton] = useState(false);
  const memberIds = currentChannel?.state?.members ? Object.keys(currentChannel.state.members) : [];

  const onCloseDialog = () => {
    dispatch(SetOpenInviteFriendDialog(false));
    setSearchQuery('');
    setSelectedUsers([]);
  };

  const onInviteMembers = async () => {
    try {
      setLoadingButton(true);
      await currentChannel.addMembers(selectedUsers.map(user => user.id));
      dispatch(showSnackbar({ severity: 'success', message: t('inviteFriendDialog.snackbar_success') }));
    } catch (error) {
      handleError(dispatch, error, t);
    } finally {
      setLoadingButton(false);
      onCloseDialog();
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openInviteFriendDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
    >
      <DialogTitle>{t('inviteFriendDialog.title')}</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        <Stack spacing={3} sx={{ position: 'relative' }}>
          <Search>
            <SearchIconWrapper>{<MagnifyingGlass size={18} />}</SearchIconWrapper>
            <StyledInputBase
              placeholder={t('inviteFriendDialog.search')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ height: '48px' }}
              autoFocus
            />
          </Search>

          {selectedUsers.length > 0 && (
            <Stack direction="row" flexWrap="wrap">
              {selectedUsers.map(user => (
                <Chip
                  key={user.id}
                  label={user.name}
                  avatar={<MemberAvatar member={user} width={28} height={28} shape={AvatarShape.Round} />}
                  onDelete={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '12px',
                    height: '36px',
                    paddingLeft: '5px',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: theme.palette.text.primary,
                    margin: '0px 8px 8px 0px',
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              ))}
            </Stack>
          )}

          <Stack
            className="customScrollbar"
            sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              height: '450px',
              marginRight: '-15px!important',
              paddingRight: '12px',
              paddingBottom: '80px',
            }}
          >
            <FriendList
              searchQuery={searchQuery}
              selectedUsers={selectedUsers}
              onCheck={(user, newSelectedUsers) => {
                setSelectedUsers(newSelectedUsers);
              }}
              excludedUserIds={memberIds}
            />
          </Stack>

          <Stack
            spacing={2}
            direction={'row'}
            alignItems="center"
            sx={{
              position: 'absolute',
              bottom: '-24px',
              left: '-24px',
              right: '-24px',
              zIndex: 1,
              padding: '15px',
              borderTop: theme => `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <LoadingButton
              size="large"
              variant="contained"
              loading={loadingButton}
              sx={{ flex: 1 }}
              disabled={selectedUsers.length === 0}
              onClick={onInviteMembers}
            >
              {t('inviteFriendDialog.invite')} {selectedUsers.length} {t('inviteFriendDialog.members')}
            </LoadingButton>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendDialog;
