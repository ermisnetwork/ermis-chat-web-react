import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography, Button, Checkbox } from '@mui/material';
import { ArrowLeft, Lock } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType } from '../../redux/slices/app';
import { RoleMember, SidebarType } from '../../constants/commons-const';
import { getChannelMembers, getMemberInfoInChannel, handleError } from '../../utils/commons';
import { MemberElement } from '../../components/MemberElement';
import { LoadingButton } from '@mui/lab';
import { ClientEvents } from '../../constants/events-const';

const ListMember = ({ setIsShow, members }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);

  const [loadingButton, setLoadingButton] = useState(false);
  const [checkedMemberIds, setCheckedMemberIds] = useState([]);

  const onChangeMember = memberId => {
    const currentIndex = checkedMemberIds.indexOf(memberId);
    const newChecked = [...checkedMemberIds];

    if (currentIndex === -1) {
      newChecked.push(memberId);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setCheckedMemberIds(newChecked);
  };

  const onBanMembers = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChannel.banMembers(checkedMemberIds);
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
            color="error"
            sx={{ borderRadius: '32px' }}
            disabled={checkedMemberIds.length === 0}
            onClick={onBanMembers}
          >
            <Lock size={16} />
            &nbsp;Ban
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
                      <Checkbox
                        sx={{ marginRight: '15px' }}
                        checked={checkedMemberIds.indexOf(member.user_id) !== -1}
                        onChange={() => onChangeMember(member.user_id)}
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

const ChannelBannedUsers = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel } = useSelector(state => state.channel);
  const { all_members } = useSelector(state => state.member);
  const [members, setMembers] = useState([]); // channel_role is member and banned is false
  const [bannedMembers, setBannedMembers] = useState([]); // channel_role is member and banned is true
  const [isShow, setIsShow] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      const members = getChannelMembers(currentChannel, all_members);
      setBannedMembers(members.filter(item => item.channel_role === RoleMember.MEMBER && item.banned));
      setMembers(members.filter(item => item.channel_role === RoleMember.MEMBER && !item.banned));

      const handleMemberBanned = event => {
        const memberInfoInChannel = getMemberInfoInChannel(event.member, all_members);

        setBannedMembers(prev => {
          return [...prev, memberInfoInChannel];
        });

        setMembers(prev => {
          return prev.filter(item => item.id !== event.member.user_id);
        });
      };

      const handleMemberUnBanned = event => {
        const memberInfoInChannel = getMemberInfoInChannel(event.member, all_members);
        setBannedMembers(prev => {
          return prev.filter(item => item.id !== event.member.user_id);
        });

        setMembers(prev => {
          return [...prev, memberInfoInChannel];
        });
      };

      currentChannel.on(ClientEvents.MemberBanned, handleMemberBanned);
      currentChannel.on(ClientEvents.MemberUnBanned, handleMemberUnBanned);

      return () => {
        currentChannel.off(ClientEvents.MemberBanned, handleMemberBanned);
        currentChannel.off(ClientEvents.MemberUnBanned, handleMemberUnBanned);
      };
    }
  }, [currentChannel, all_members]);

  const onUnbanMember = async data => {
    try {
      const response = await currentChannel.unbanMembers([data.user_id]);
    } catch (error) {
      handleError(dispatch, error);
    }
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
                Banned members
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
                <Button variant="text" size="small" onClick={() => setIsShow(true)} color="error">
                  <Lock size={16} />
                  &nbsp;Ban members
                </Button>
              </Box>

              <div style={{ overflowY: 'auto', height: 'calc(100% - 46px)' }} className="customScrollbar">
                <Stack spacing={2}>
                  {bannedMembers.length > 0 ? (
                    bannedMembers.map(member => {
                      return (
                        <MemberElement
                          key={member.user_id}
                          showMenu={true}
                          data={member}
                          onRemoveMember={null}
                          onUnbanMember={onUnbanMember}
                        />
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
      )}
    </>
  );
};

export default ChannelBannedUsers;
