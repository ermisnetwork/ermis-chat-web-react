import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

// Constants
import { CurrentChannelStatus, SidebarType } from '../../constants/commons-const';
import { DEFAULT_PATH } from '../../config';

// Utils
import { splitChannelId } from '../../utils/commons';

// Redux
import { ConnectCurrentChannel } from '../../redux/slices/channel';

// Components
import ChatComponent from './ChatComponent';
import ChannelNotFound from '../../sections/dashboard/ChannelNotFound';
import SidebarPanel from './SidebarPanel';
import BoxContainer from '../../layouts/dashboard/BoxContainer';
import LoadingScreen from '../../components/LoadingScreen';
import InviteFriendDialog from '../../sections/dashboard/InviteFriendDialog';

// Sidebar Components
import SidebarChannelInfo from '../../sections/dashboard/SidebarChannelInfo';
import SidebarChannelType from '../../sections/dashboard/SidebarChannelType';
import SidebarMembers from '../../sections/dashboard/SidebarMembers';
import SidebarPermissions from '../../sections/dashboard/SidebarPermissions';
import SidebarAdministrators from '../../sections/dashboard/SidebarAdministrators';
import SidebarBanned from '../../sections/dashboard/SidebarBanned';
import SidebarKeywords from '../../sections/dashboard/SidebarKeywords';
import SidebarSearchMessage from '../../sections/dashboard/SidebarSearchMessage';
import SidebarUserInfo from '../../sections/dashboard/SidebarUserInfo';
import SidebarChannelTopic from '../../sections/dashboard/SidebarChannelTopic';
import SidebarTopicInfo from '../../sections/dashboard/SidebarTopicInfo';

const ChannelDetailApp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentChannelStatus, loadingChannels } = useSelector(state => state.channel);
  const { sideBar, isUserConnected } = useSelector(state => state.app);
  const { id } = useParams();

  useEffect(() => {
    if (!id || !isUserConnected || loadingChannels) {
      return;
    }

    const result = splitChannelId(id);
    if (result) {
      dispatch(ConnectCurrentChannel(result.channelId, result.channelType));
    } else {
      navigate(DEFAULT_PATH);
    }
  }, [dispatch, id, isUserConnected, navigate, loadingChannels]);

  // Memoized sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    switch (sideBar?.type) {
      case SidebarType.Channel:
        return <SidebarChannelInfo />;
      case SidebarType.ChannelType:
        return <SidebarChannelType />;
      case SidebarType.Members:
        return <SidebarMembers />;
      case SidebarType.Permissions:
        return <SidebarPermissions />;
      case SidebarType.Administrators:
        return <SidebarAdministrators />;
      case SidebarType.BannedUsers:
        return <SidebarBanned />;
      case SidebarType.SearchMessage:
        return <SidebarSearchMessage />;
      case SidebarType.KeywordFiltering:
        return <SidebarKeywords />;
      case SidebarType.UserInfo:
        return <SidebarUserInfo />;
      case SidebarType.ChannelTopics:
        return <SidebarChannelTopic />;
      case SidebarType.TopicInfo:
        return <SidebarTopicInfo />;
      default:
        return null;
    }
  }, [sideBar?.type]);

  return (
    <>
      <BoxContainer>
        {loadingChannels ? (
          <LoadingScreen />
        ) : currentChannelStatus === CurrentChannelStatus.ERROR ? (
          <ChannelNotFound />
        ) : (
          <ChatComponent />
        )}
        <InviteFriendDialog />
      </BoxContainer>

      <SidebarPanel>{sidebarContent}</SidebarPanel>
    </>
  );
};

export default ChannelDetailApp;
