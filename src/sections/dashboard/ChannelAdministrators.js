import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, IconButton, Stack, Typography, Radio } from '@mui/material';
import { ArrowLeft, Plus } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType } from '../../redux/slices/app';
import { ConfirmType, RoleMember, SidebarType } from '../../constants/commons-const';
import { getChannelMembers, getMemberInfoInChannel, handleError } from '../../utils/commons';
import { MemberElement } from '../../components/MemberElement';
import { ClientEvents } from '../../constants/events-const';
import { LoadingButton } from '@mui/lab';
import { setChannelConfirm } from '../../redux/slices/dialog';

const ListMember = ({ setIsShow, members }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);

  const [selectedValue, setSelectedValue] = useState('');
  const [loadingButton, setLoadingButton] = useState(false);

  const onChangeMember = event => {
    setSelectedValue(event.target.value);
  };

  const onAddMod = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChannel.addModerators([selectedValue]);
      if (response) {
        setLoadingButton(false);
        setIsShow(false);
      }
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '74px',
        }}
      >
        <Stack
          sx={{ height: '100%' }}
          direction="row"
          alignItems={'center'}
          spacing={2}
          p={2}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems={'center'} spacing={2}>
            <IconButton
              onClick={() => {
                setIsShow(false);
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
              Members
            </Typography>
          </Stack>

          <LoadingButton
            loading={loadingButton}
            variant="contained"
            size="small"
            sx={{ borderRadius: '32px' }}
            disabled={selectedValue === ''}
            onClick={onAddMod}
          >
            <Plus size={16} />
            &nbsp;Add
          </LoadingButton>
        </Stack>
      </Box>

      <Stack
        sx={{
          height: 'calc(100% - 74px)',
          position: 'relative',
          flexGrow: 1,
        }}
        spacing={2}
        p={2}
      >
        <Stack sx={{ width: '100%', height: '100%' }}>
          <div style={{ overflowY: 'auto', height: '100%' }} className="customScrollbar">
            <Stack spacing={2}>
              {members.length > 0 ? (
                members.map(member => {
                  return (
                    <Box key={member.user_id} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Radio
                        sx={{ marginRight: '15px' }}
                        checked={selectedValue === member.user_id}
                        onChange={onChangeMember}
                        value={member.user_id}
                        name="radio-buttons"
                        inputProps={{ 'aria-label': member.user_id }}
                      />
                      <MemberElement showMenu={false} data={member} onRemoveMember={null} onUnbanMember={null} />
                    </Box>
                  );
                })
              ) : (
                <Typography
                  sx={{
                    textAlign: 'center',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                  }}
                >
                  No members
                </Typography>
              )}
            </Stack>
          </div>
        </Stack>
      </Stack>
    </>
  );
};

const ChannelAdministrators = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel } = useSelector(state => state.channel);
  const { all_members } = useSelector(state => state.member);

  const [administrators, setAdministrators] = useState([]); // channel_role is owner, moder
  const [members, setMembers] = useState([]); // channel_role is member
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      const members = getChannelMembers(currentChannel, all_members);
      setAdministrators(members.filter(item => [RoleMember.OWNER, RoleMember.MOD].includes(item.channel_role)));
      setMembers(members.filter(item => item.channel_role === RoleMember.MEMBER && !item.banned));

      const handleMemberPromoted = event => {
        const memberInfoInChannel = getMemberInfoInChannel(event.member, all_members);

        setAdministrators(prev => {
          return [...prev, memberInfoInChannel];
        });

        setMembers(prev => {
          return prev.filter(item => item.id !== event.member.user_id);
        });
      };

      const handleMemberDemoted = event => {
        const memberInfoInChannel = getMemberInfoInChannel(event.member, all_members);
        setAdministrators(prev => {
          return prev.filter(item => item.id !== event.member.user_id);
        });

        setMembers(prev => {
          return [...prev, memberInfoInChannel];
        });
      };

      currentChannel.on(ClientEvents.MemberPromoted, handleMemberPromoted);
      currentChannel.on(ClientEvents.MemberDemoted, handleMemberDemoted);

      return () => {
        currentChannel.off(ClientEvents.MemberPromoted, handleMemberPromoted);
        currentChannel.off(ClientEvents.MemberDemoted, handleMemberDemoted);
      };
    }
  }, [currentChannel, all_members]);

  const onRemoveModer = data => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: data.user_id,
      type: ConfirmType.REMOVE_MODER,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <>
      {isShow ? (
        <ListMember setIsShow={setIsShow} members={members} />
      ) : (
        <>
          <Box
            sx={{
              width: '100%',
              height: '74px',
            }}
          >
            <Stack
              sx={{ height: '100%' }}
              direction="row"
              alignItems={'center'}
              spacing={2}
              p={2}
              justifyContent="space-between"
            >
              <IconButton
                onClick={() => {
                  dispatch(UpdateSidebarType(SidebarType.Channel));
                }}
              >
                <ArrowLeft />
              </IconButton>
              <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
                Administrators
              </Typography>
            </Stack>
          </Box>
          <Stack
            sx={{
              height: 'calc(100% - 74px)',
              position: 'relative',
              flexGrow: 1,
            }}
            spacing={2}
            p={2}
          >
            <Stack sx={{ width: '100%', height: '100%' }}>
              <Box sx={{ paddingBottom: '15px', height: '46px' }}>
                <Button variant="text" size="small" onClick={() => setIsShow(true)}>
                  <Plus size={16} />
                  &nbsp;Add Moderator
                </Button>
              </Box>

              <div style={{ overflowY: 'auto', height: 'calc(100% - 46px)' }} className="customScrollbar">
                <Stack spacing={2}>
                  {administrators.map(member => {
                    const memberRole = member.channel_role;

                    return (
                      <MemberElement
                        key={member.user_id}
                        showMenu={memberRole === RoleMember.MOD}
                        data={member}
                        onRemoveMember={onRemoveModer}
                        onUnbanMember={null}
                      />
                    );
                  })}
                </Stack>
              </div>
            </Stack>
          </Stack>
        </>
      )}
    </>
  );
};

export default ChannelAdministrators;
