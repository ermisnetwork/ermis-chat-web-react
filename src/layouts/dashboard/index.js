import React, { useEffect } from 'react';
import { Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Navigate, Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import { useDispatch, useSelector } from 'react-redux';
import { client, connectUser } from '../../client';
import { FetchUserProfile } from '../../redux/slices/member';
import { CHAT_PROJECT_ID } from '../../config';
import { ClientEvents } from '../../constants/events-const';
import { LocalStorageKey } from '../../constants/localStorage-const';
import CreateChannel from '../../sections/dashboard/CreateChannel';
import NewDirectMessage from '../../sections/dashboard/NewDirectMessage';
import ChannelConfirmDialog from '../../sections/dashboard/ChannelConfirmDialog';
import ProfileDialog from '../../sections/dashboard/ProfileDialog';
import ClientsTabPanel from '../../pages/dashboard/ClientsTabPanel';
import useFaviconBadge from '../../hooks/useFaviconBadge';
import { AddUnreadChannel, RemoveUnreadChannel, UpdateUnreadChannel } from '../../redux/slices/channel';
import CallDirectDialog2 from '../../sections/dashboard/CallDirectDialog2';
import Header from './Header';
import { SetIsUserConnected } from '../../redux/slices/app';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { isLoggedIn, user_id } = useSelector(state => state.auth);
  const { openDialogNewDirectMessage, openDialogCreateChannel, openDialogProfile, channelConfirm } = useSelector(
    state => state.dialog,
  );
  const { unreadChannels } = useSelector(state => state.channel);

  const accessToken = localStorage.getItem(LocalStorageKey.AccessToken);

  useFaviconBadge(unreadChannels);

  useEffect(() => {
    // Lưu lại overflow cũ để khôi phục khi unmount
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const onConnectUser = async () => {
        const response = await connectUser(CHAT_PROJECT_ID, user_id, accessToken, dispatch);
        dispatch(SetIsUserConnected(response));
      };
      onConnectUser();
      fetchDataInitial();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (client) {
      const handleMessageNew = event => {
        const channelId = event.channel_id;
        const unreadCount = event.unread_count;
        if (event.user.id !== user_id && unreadChannels) {
          const existingChannel = unreadChannels.find(item => item.id === channelId);
          dispatch(
            existingChannel && unreadCount > 0
              ? UpdateUnreadChannel(channelId, unreadCount)
              : AddUnreadChannel(channelId, unreadCount),
          );
        }
      };

      const handleMessageRead = event => {
        const channelId = event.channel_id;

        if (event.user.id === user_id && unreadChannels.some(item => item.id === channelId)) {
          dispatch(RemoveUnreadChannel(channelId));
        }
      };

      client.on(ClientEvents.MessageNew, handleMessageNew);
      client.on(ClientEvents.MessageRead, handleMessageRead);
      return () => {
        client.off(ClientEvents.MessageRead, handleMessageRead);
      };
    }
  }, [client, unreadChannels, user_id]);

  const fetchDataInitial = async () => {
    await Promise.all([dispatch(FetchUserProfile())]);
  };

  if (!isLoggedIn) {
    return <Navigate to={'/login'} />;
  }

  return (
    <>
      <Stack direction="row" sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <SideNav />
        <Stack direction="column" sx={{ height: '100%', minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
          <Header />

          <Stack
            className={theme.palette.mode === 'light' ? 'lightTheme' : 'darkTheme'}
            direction="row"
            sx={{
              overflow: 'hidden',
              backgroundColor: theme.palette.background.neutral,
              padding: '15px',
              minHeight: 'auto',
              minWidth: 'auto',
              flex: 1,
            }}
            spacing={2}
          >
            <ClientsTabPanel />
            <Outlet />
          </Stack>
        </Stack>
      </Stack>

      <CallDirectDialog2 />
      {openDialogCreateChannel && <CreateChannel />}
      {openDialogNewDirectMessage && <NewDirectMessage />}
      {openDialogProfile && <ProfileDialog />}
      {channelConfirm?.openDialog && <ChannelConfirmDialog />}
    </>
  );
};

export default DashboardLayout;
