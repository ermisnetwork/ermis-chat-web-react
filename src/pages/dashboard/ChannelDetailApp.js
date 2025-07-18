import React, { useEffect } from 'react';
import ChatComponent from './ChatComponent';
import { useDispatch, useSelector } from 'react-redux';
import ChannelInfo from '../../sections/dashboard/ChannelInfo';
import Members from '../../sections/dashboard/Members';
import { CurrentChannelStatus, SidebarType } from '../../constants/commons-const';
import ChannelPermissions from '../../sections/dashboard/ChannelPermissions';
import ChannelMedia from '../../sections/dashboard/ChannelMedia';
import ChannelAdministrators from '../../sections/dashboard/ChannelAdministrators';
import ChannelBannedUsers from '../../sections/dashboard/ChannelBannedUsers';
import ChannelSearch from '../../sections/dashboard/ChannelSearch';
import ChannelKeywordFiltering from '../../sections/dashboard/ChannelKeywordFiltering';
import { useParams, useNavigate } from 'react-router-dom';
import { splitChannelId } from '../../utils/commons';
import { ConnectCurrentChannel } from '../../redux/slices/channel';
import { DEFAULT_PATH } from '../../config';
import ChannelNotFound from '../../sections/dashboard/ChannelNotFound';
import SidebarPanel from './SidebarPanel';
import BoxContainer from '../../layouts/dashboard/BoxContainer';
import { client } from '../../client';

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
      </BoxContainer>

      {sideBar.open &&
        (() => {
          switch (sideBar.type) {
            case SidebarType.Channel:
              return (
                <SidebarPanel>
                  <ChannelInfo />
                </SidebarPanel>
              );

            case SidebarType.Members:
              return (
                <SidebarPanel>
                  <Members />
                </SidebarPanel>
              );

            case SidebarType.Permissions:
              return (
                <SidebarPanel>
                  <ChannelPermissions />
                </SidebarPanel>
              );

            case SidebarType.Media:
              return (
                <SidebarPanel>
                  <ChannelMedia />
                </SidebarPanel>
              );

            case SidebarType.Administrators:
              return (
                <SidebarPanel>
                  <ChannelAdministrators />
                </SidebarPanel>
              );

            case SidebarType.BannedUsers:
              return (
                <SidebarPanel>
                  <ChannelBannedUsers />
                </SidebarPanel>
              );

            case SidebarType.SearchMessage:
              return (
                <SidebarPanel>
                  <ChannelSearch />
                </SidebarPanel>
              );

            case SidebarType.KeywordFiltering:
              return (
                <SidebarPanel>
                  <ChannelKeywordFiltering />
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
