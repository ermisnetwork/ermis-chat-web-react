import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Button,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowLeft, MagnifyingGlass, UserCirclePlus } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import FormProvider from '../../components/hook-form/FormProvider';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import MemberAvatar from '../../components/MemberAvatar';
import {
  formatString,
  getChannelMembers,
  getMemberInfoInChannel,
  handleError,
  isGuestInPublicChannel,
} from '../../utils/commons';
import { ClientEvents } from '../../constants/events-const';
import RHFAutocompleteFriends from '../../components/hook-form/RHFAutocompleteFriends';
import { RoleMember, SidebarType, TabMembers } from '../../constants/commons-const';
import TabMembersOther from './TabMembersOther';
import TabMembersPending from './TabMembersPending';
import { FetchFriends } from '../../redux/slices/member';
import { client } from '../../client';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MemberInvitation = ({ openDialog, onCloseDialog, membersInChannel }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (openDialog) {
      dispatch(FetchFriends());
    }
  }, [openDialog]);

  const NewGroupSchema = Yup.object().shape({
    members: Yup.array().min(1, 'Must have at least 1 members'),
  });

  const defaultValues = {
    members: [],
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const { reset, watch, setValue, handleSubmit } = methods;

  const onSubmit = async data => {
    try {
      setIsLoading(true);
      const response = await currentChannel.addMembers(data.members.map(member => member.id));
      if (response) {
        // const channelId = response.channel.id;
        // const channelType = response.channel.type;
        // dispatch(WatchCurrentChannel(channelId, channelType));
        setIsLoading(false);
        onCloseDialog();
        reset();
        dispatch(showSnackbar({ severity: 'success', message: 'Members added successfully' }));
      }
    } catch (error) {
      setIsLoading(false);
      handleError(dispatch, error);
    }
  };

  const onRemoveMember = member => {
    setValue(
      'members',
      watch('members').filter(item => item.id !== member.id),
    );
  };

  const selectedMembers = watch('members');

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      <DialogTitle>{'Invite members to this channel'}</DialogTitle>

      <DialogContent sx={{ mt: 4, overflowY: 'visible' }}>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <RHFAutocompleteFriends
              name="members"
              label="Friends"
              multiple
              ChipProps={{ size: 'medium' }}
              getOptionDisabled={option => membersInChannel.some(member => member.id === option.id)}
            />
            <Paper elevation={2} sx={{ height: 350, overflowY: 'auto' }} className="customScrollbar">
              {selectedMembers.length === 0 && (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: theme.palette.background.paper,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  p={1}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                    }}
                  >
                    No members selected
                  </Typography>
                </Box>
              )}

              {selectedMembers.map(member => {
                return (
                  <Box
                    sx={{
                      width: '100%',
                      backgroundColor: theme.palette.background.paper,
                    }}
                    p={1}
                    key={member.id}
                  >
                    <Stack direction="row" alignItems={'center'} justifyContent="space-between">
                      <Stack direction="row" alignItems={'center'} spacing={2}>
                        <MemberAvatar member={member} width={30} height={30} />
                        <Stack spacing={0.3}>
                          <Typography variant="subtitle2">
                            {formatString(member.name ? member.name : member.id)}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Stack direction={'row'} spacing={2} alignItems={'center'}>
                        <Button
                          color="error"
                          onClick={() => {
                            onRemoveMember(member);
                          }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Paper>

            <Stack spacing={2} direction={'row'} alignItems="center" justifyContent={'end'}>
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isLoading}
                sx={{ width: '100%' }}
                disabled={selectedMembers.length === 0}
              >
                Invite member
              </LoadingButton>
            </Stack>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

const LIST_TAB = ['Members', 'Invited Members'];

const Members = () => {
  const dispatch = useDispatch();
  const users = client.state.users ? Object.values(client.state.users) : [];

  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const [indexTab, setIndexTab] = useState(TabMembers.Members);
  const [openDialog, setOpenDialog] = useState(false);
  const [membersInChannel, setMembersInChannel] = useState([]); // all member in channel
  const [membersOther, setMembersOther] = useState([]); // channel_role is owner, mod, member
  const [membersPending, setMembersPending] = useState([]); // channel_role is pending
  const [searchTerm, setSearchTerm] = useState('');
  const isGuest = isGuestInPublicChannel(currentChannel);

  useEffect(() => {
    if (currentChannel) {
      const members = getChannelMembers(currentChannel, users);
      const membersOther = members.filter(item => item.channel_role !== RoleMember.PENDING);
      const membersPending = members.filter(item => item.channel_role === RoleMember.PENDING);
      setMembersInChannel(members);
      setMembersOther(membersOther);
      setMembersPending(membersPending);

      if (indexTab === TabMembers.Members) {
        if (searchTerm) {
          const results = membersOther.filter(member => member.name.toLowerCase().includes(searchTerm));
          setMembersOther(results);
        } else {
          setMembersOther(membersOther);
        }
      } else {
        if (searchTerm) {
          const results = membersPending.filter(member => member.name.toLowerCase().includes(searchTerm));
          setMembersPending(results);
        } else {
          setMembersPending(membersPending);
        }
      }

      const handleMemberRemoved = event => {
        if (event.member.user_id !== user_id) {
          setMembersInChannel(prev => {
            return prev.filter(item => item.id !== event.member.user_id);
          });
          setMembersOther(prev => {
            return prev.filter(item => item.id !== event.member.user_id);
          });
        }
      };

      const handleInviteAccept = event => {
        const memberInfoInChannel = getMemberInfoInChannel(event.member, users);
        setMembersInChannel(prev => {
          return [...prev, memberInfoInChannel];
        });
        setMembersOther(prev => {
          return [...prev, memberInfoInChannel];
        });
        setMembersPending(prev => {
          return prev.filter(item => item.id !== event.member.user_id);
        });
      };

      currentChannel.on(ClientEvents.MemberRemoved, handleMemberRemoved);
      currentChannel.on(ClientEvents.Notification.InviteAccepted, handleInviteAccept);

      return () => {
        currentChannel.off(ClientEvents.MemberRemoved, handleMemberRemoved);
        currentChannel.off(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
      };
    }
  }, [currentChannel, users, indexTab, searchTerm, user_id]);

  const onOpenDialog = () => {
    setOpenDialog(true);
  };

  const onCloseDialog = () => {
    setOpenDialog(false);
  };

  const onChangeTab = (event, newValue) => {
    setIndexTab(newValue);
    setSearchTerm('');
  };

  const onSearchMember = event => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
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
          <IconButton
            onClick={() => {
              dispatch(UpdateSidebarType(SidebarType.Channel));
            }}
          >
            <ArrowLeft />
          </IconButton>
          <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
            Members
          </Typography>

          {!isGuest && (
            <IconButton onClick={onOpenDialog}>
              <UserCirclePlus />
            </IconButton>
          )}
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
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={indexTab}
                onChange={onChangeTab}
                indicatorColor="secondary"
                textColor="inherit"
                variant="fullWidth"
              >
                {LIST_TAB.map((item, index) => {
                  return <Tab key={index} label={item} />;
                })}
              </Tabs>
            </Box>

            <Search sx={{ margin: '15px 0' }}>
              <SearchIconWrapper>
                <MagnifyingGlass color="#709CE6" />
              </SearchIconWrapper>
              <StyledInputBase
                autoFocus
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
                onChange={onSearchMember}
                value={searchTerm}
              />
            </Search>
          </Box>

          <div style={{ overflowY: 'auto', height: 'calc(100% - 118px)' }} className="customScrollbar">
            <TabMembersOther indexTab={indexTab} members={membersOther} />
            <TabMembersPending indexTab={indexTab} members={membersPending} />
          </div>
        </Stack>
      </Stack>

      <MemberInvitation openDialog={openDialog} onCloseDialog={onCloseDialog} membersInChannel={membersInChannel} />
    </>
  );
};

export default Members;

export { MemberInvitation };
