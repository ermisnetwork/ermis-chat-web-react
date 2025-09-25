import React, { useEffect } from 'react';
import { Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Navigate, Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import { useDispatch, useSelector } from 'react-redux';
import { connectUser } from '../../client';
import { FetchUserProfile } from '../../redux/slices/member';
import { CHAT_PROJECT_ID } from '../../config';
import { LocalStorageKey } from '../../constants/localStorage-const';
import CreateChannel from '../../sections/dashboard/CreateChannel';
import NewDirectMessage from '../../sections/dashboard/NewDirectMessage';
import AddFriendDialog from '../../sections/dashboard/AddFriendDialog';
import ChannelConfirmDialog from '../../sections/dashboard/ChannelConfirmDialog';
import ProfileDialog from '../../sections/dashboard/ProfileDialog';
import ClientsTabPanel from '../../pages/dashboard/ClientsTabPanel';
import useFaviconBadge from '../../hooks/useFaviconBadge';
import CallDirectDialog3 from '../../sections/dashboard/CallDirectDialog3';
import CallDirectDialog2 from '../../sections/dashboard/CallDirectDialog2';
import Header from './Header';
import { SetIsUserConnected } from '../../redux/slices/app';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { isLoggedIn, user_id } = useSelector(state => state.auth);
  const {
    openDialogNewDirectMessage,
    openAddFriendDialog,
    openDialogCreateChannel,
    openDialogProfile,
    channelConfirm,
  } = useSelector(state => state.dialog);
  const { unreadChannels } = useSelector(state => state.channel);

  const accessToken = localStorage.getItem(LocalStorageKey.AccessToken);

  useFaviconBadge(unreadChannels);

  useEffect(() => {
    let hiddenTime = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else if (hiddenTime) {
        const elapsed = Date.now() - hiddenTime;
        // Nếu tab bị ẩn hơn 1 tiếng (3600000 ms), reload lại
        if (elapsed > 3600000) {
          window.location.reload();
        }
        hiddenTime = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

      {/* <CallDirectDialog3 /> */}
      <CallDirectDialog2 />
      {openDialogCreateChannel && <CreateChannel />}
      {openDialogNewDirectMessage && <NewDirectMessage />}
      {openAddFriendDialog && <AddFriendDialog />}
      {openDialogProfile && <ProfileDialog />}
      {channelConfirm?.openDialog && <ChannelConfirmDialog />}
    </>
  );
};

export default DashboardLayout;
