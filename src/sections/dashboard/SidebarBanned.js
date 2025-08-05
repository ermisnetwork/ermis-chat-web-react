import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { CaretLeft } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar, UpdateSidebarType } from '../../redux/slices/app';
import { ConfirmType, RoleMember, SidebarType } from '../../constants/commons-const';
import { handleError } from '../../utils/commons';
import MemberElement from '../../components/MemberElement';
import { LoadingButton } from '@mui/lab';
import { setChannelConfirm } from '../../redux/slices/dialog';
import { BannedIcon } from '../../components/Icons';
import NoResult from '../../assets/Illustration/NoResult';

const ListMembers = ({ selectedMembers, setSelectedMembers }) => {
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const filteredMembers = members
    .filter(member => member.channel_role === RoleMember.MEMBER && !member.banned)
    .sort((a, b) => {
      return a.user.name.localeCompare(b.user.name);
    });

  return (
    <Stack spacing={1}>
      {filteredMembers.map(member => {
        return (
          <MemberElement
            key={member.user_id}
            member={member}
            onCheck={(member, newSelectedMembers) => {
              setSelectedMembers(newSelectedMembers);
            }}
            selectedMembers={selectedMembers}
          />
        );
      })}
    </Stack>
  );
};

const ListBanned = ({}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const filteredAdministrators = members
    .filter(member => member.channel_role === RoleMember.MEMBER && member.banned)
    .sort((a, b) => {
      return a.user.name.localeCompare(b.user.name);
    });

  const onUnbanMember = async member => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: member.user_id,
      type: ConfirmType.UNBANNED,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <Stack spacing={1}>
      {filteredAdministrators.length > 0 ? (
        filteredAdministrators.map(member => {
          return <MemberElement key={member.user_id} member={member} onUnbanMember={onUnbanMember} />;
        })
      ) : (
        <Stack
          sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', mt: '30px!important' }}
        >
          <NoResult width={180} height={180} />
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: 16,
              color: theme.palette.text.primary,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            No banned member!
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: 14,
              color: theme.palette.text.secondary,
              fontWeight: 400,
            }}
          >
            Good vibes only - No ban here.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

const SidebarBanned = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const [isBanned, setIsBanned] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingButton, setLoadingButton] = useState(false);

  const onSaveClick = async () => {
    try {
      setLoadingButton(true);
      await currentChannel.banMembers(selectedMembers.map(m => m.user_id));
      dispatch(showSnackbar({ severity: 'success', message: 'Banned members successfully' }));
      setIsBanned(false);
      setSelectedMembers([]);
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setLoadingButton(false);
    }
  };

  return (
    <Stack sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <IconButton
          onClick={() => {
            if (isBanned) {
              setIsBanned(false);
            } else {
              dispatch(UpdateSidebarType(SidebarType.Channel));
            }
          }}
        >
          <CaretLeft size={20} color={theme.palette.text.primary} />
        </IconButton>

        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          Banned Members
        </Typography>

        <LoadingButton
          variant="text"
          size="small"
          color="error"
          onClick={onSaveClick}
          disabled={selectedMembers.length === 0}
          loading={loadingButton}
          sx={{ visibility: isBanned ? 'visible' : 'hidden' }}
        >
          BANNED
        </LoadingButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
        {isBanned ? (
          <Typography variant="body1" sx={{ fontSize: '18px', fontWeight: 600, color: theme.palette.text.primary }}>
            Channel Members
          </Typography>
        ) : (
          <Button
            variant="text"
            size="large"
            startIcon={<BannedIcon />}
            fullWidth
            onClick={() => setIsBanned(true)}
            sx={{
              boxShadow: theme.shadows[6],
              justifyContent: 'left',
              color: theme.palette.text.primary,
              borderRadius: '16px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            Banned
          </Button>
        )}

        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            marginLeft: '-24px!important',
            marginRight: '-24px!important',
            padding: '0 24px',
            minHeight: 'auto',
            flex: 1,
          }}
        >
          {isBanned ? (
            <ListMembers selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} />
          ) : (
            <ListBanned />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarBanned;
