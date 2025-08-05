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
import { ProfileAddIcon } from '../../components/Icons';

const ListMembers = ({ selectedMembers, setSelectedMembers }) => {
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const filteredMembers = members
    .filter(member => member.channel_role === RoleMember.MEMBER)
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

const ListAdministrators = ({}) => {
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const members = Object.values(currentChannel?.state?.members || {}) || [];

  const rolePriority = {
    owner: 1,
    moder: 2,
  };

  const filteredAdministrators = members
    .filter(member => [RoleMember.OWNER, RoleMember.MOD].includes(member.channel_role))
    .sort((a, b) => {
      // So sánh theo thứ tự role trước
      if (rolePriority[a.channel_role] !== rolePriority[b.channel_role]) {
        return rolePriority[a.channel_role] - rolePriority[b.channel_role];
      }
      // Nếu role giống nhau, so sánh theo tên (alphabetical order)
      return a.user.name.localeCompare(b.user.name);
    });

  const onRemoveModer = member => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: member.user_id,
      type: ConfirmType.REMOVE_MODER,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <Stack spacing={1}>
      {filteredAdministrators.map(member => {
        return <MemberElement key={member.user_id} member={member} onRemoveMember={onRemoveModer} />;
      })}
    </Stack>
  );
};

const SidebarAdministrators = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const [isAdd, setIsAdd] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingButton, setLoadingButton] = useState(false);

  const onSaveClick = async () => {
    try {
      setLoadingButton(true);
      await currentChannel.addModerators(selectedMembers.map(m => m.user_id));
      dispatch(showSnackbar({ severity: 'success', message: 'Added moderators successfully' }));
      setIsAdd(false);
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
            if (isAdd) {
              setIsAdd(false);
            } else {
              dispatch(UpdateSidebarType(SidebarType.Channel));
            }
          }}
        >
          <CaretLeft size={20} color={theme.palette.text.primary} />
        </IconButton>

        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          Administrators
        </Typography>

        <LoadingButton
          variant="text"
          size="small"
          onClick={onSaveClick}
          disabled={selectedMembers.length === 0}
          loading={loadingButton}
          sx={{ visibility: isAdd ? 'visible' : 'hidden' }}
        >
          ADD
        </LoadingButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
        {isAdd ? (
          <Typography variant="body1" sx={{ fontSize: '18px', fontWeight: 600, color: theme.palette.text.primary }}>
            Channel Members
          </Typography>
        ) : (
          <Button
            variant="text"
            size="large"
            startIcon={<ProfileAddIcon />}
            fullWidth
            onClick={() => setIsAdd(true)}
            sx={{
              boxShadow: theme.shadows[6],
              justifyContent: 'left',
              color: theme.palette.text.primary,
              borderRadius: '16px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            Add Moderator
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
          {isAdd ? (
            <ListMembers selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} />
          ) : (
            <ListAdministrators />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarAdministrators;
