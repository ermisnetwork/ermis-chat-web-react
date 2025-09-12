import React, { useEffect } from 'react';
import ChatComponent from './ChatComponent';
import { useDispatch, useSelector } from 'react-redux';
import { CurrentChannelStatus, SidebarType } from '../../constants/commons-const';
import { useParams, useNavigate } from 'react-router-dom';
import { splitChannelId } from '../../utils/commons';
import { ConnectCurrentChannel } from '../../redux/slices/channel';
import { DEFAULT_PATH } from '../../config';
import ChannelNotFound from '../../sections/dashboard/ChannelNotFound';
import SidebarPanel from './SidebarPanel';
import BoxContainer from '../../layouts/dashboard/BoxContainer';
import { client } from '../../client';
import SidebarChannelInfo from '../../sections/dashboard/SidebarChannelInfo';
import SidebarChannelType from '../../sections/dashboard/SidebarChannelType';
import SidebarMembers from '../../sections/dashboard/SidebarMembers';
import InviteFriendDialog from '../../sections/dashboard/InviteFriendDialog';
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

  const { currentChannelStatus } = useSelector(state => state.channel);
  const { sideBar, isUserConnected } = useSelector(state => state.app);
  const users = client.state.users ? Object.values(client.state.users) : [];

  const { id } = useParams();

  useEffect(() => {
    if (id && isUserConnected) {
      const result = splitChannelId(id);
      if (result) {
        dispatch(ConnectCurrentChannel(result.channelId, result.channelType));
      } else {
        navigate(`${DEFAULT_PATH}`);
      }
    }
  }, [dispatch, id, isUserConnected]);

  return (
    <>
      <BoxContainer>
        {currentChannelStatus === CurrentChannelStatus.ERROR ? <ChannelNotFound /> : <ChatComponent />}
        <InviteFriendDialog />
      </BoxContainer>

      {sideBar.open &&
        (() => {
          switch (sideBar.type) {
            case SidebarType.Channel:
              return (
                <SidebarPanel>
                  <SidebarChannelInfo />
                </SidebarPanel>
              );

            case SidebarType.ChannelType:
              return (
                <SidebarPanel>
                  <SidebarChannelType />
                </SidebarPanel>
              );

            case SidebarType.Members:
              return (
                <SidebarPanel>
                  <SidebarMembers />
                </SidebarPanel>
              );

            case SidebarType.Permissions:
              return (
                <SidebarPanel>
                  <SidebarPermissions />
                </SidebarPanel>
              );

            case SidebarType.Administrators:
              return (
                <SidebarPanel>
                  <SidebarAdministrators />
                </SidebarPanel>
              );

            case SidebarType.BannedUsers:
              return (
                <SidebarPanel>
                  <SidebarBanned />
                </SidebarPanel>
              );

            case SidebarType.SearchMessage:
              return (
                <SidebarPanel>
                  <SidebarSearchMessage />
                </SidebarPanel>
              );

            case SidebarType.KeywordFiltering:
              return (
                <SidebarPanel>
                  <SidebarKeywords />
                </SidebarPanel>
              );
            case SidebarType.UserInfo:
              return (
                <SidebarPanel>
                  <SidebarUserInfo />
                </SidebarPanel>
              );
            case SidebarType.ChannelTopics:
              return (
                <SidebarPanel>
                  <SidebarChannelTopic />
                </SidebarPanel>
              );
            case SidebarType.TopicInfo:
              return (
                <SidebarPanel>
                  <SidebarTopicInfo />
                </SidebarPanel>
              );

            default:
              break;
          }
        })()}
    </>
  );
};

export default ChannelDetailApp;
