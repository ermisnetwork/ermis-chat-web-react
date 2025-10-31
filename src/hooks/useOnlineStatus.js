import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChatType, OnlineStatusUser, RoleMember } from '../constants/commons-const';
import { ClientEvents } from '../constants/events-const';

export default function useOnlineStatus(userId) {
  const { activeChannels = [], pinnedChannels = [] } = useSelector(state => state.channel);

  const [onlineStatus, setOnlineStatus] = useState(OnlineStatusUser.UNKNOWN);

  useEffect(() => {
    if (!userId) {
      setOnlineStatus(OnlineStatusUser.UNKNOWN);
    } else {
      const allChannels = [...(activeChannels || []), ...(pinnedChannels || [])];
      if (allChannels.length) {
        const directChannels = allChannels.filter(
          item =>
            item.type === ChatType.MESSAGING &&
            item.state.members &&
            item.state.members[userId] &&
            item.state.members[userId].channel_role === RoleMember.OWNER,
        );

        if (directChannels.length && directChannels.some(channel => channel.state.members[userId])) {
          const channel = directChannels.find(channel => channel.state.members[userId]);

          const watchers = channel.state.watchers;

          if (watchers[userId]) {
            setOnlineStatus(OnlineStatusUser.ONLINE);
          } else {
            setOnlineStatus(OnlineStatusUser.OFFLINE);
          }

          const handleWatchingStart = event => {
            if (event.user.id === userId) {
              setOnlineStatus(OnlineStatusUser.ONLINE);
            }
          };

          const handleWatchingStop = event => {
            if (event.user.id === userId) {
              setOnlineStatus(OnlineStatusUser.OFFLINE);
            }
          };

          channel.on(ClientEvents.UserWatchingStart, handleWatchingStart);
          channel.on(ClientEvents.UserWatchingStop, handleWatchingStop);
          return () => {
            channel.off(ClientEvents.UserWatchingStart, handleWatchingStart);
            channel.off(ClientEvents.UserWatchingStop, handleWatchingStop);
          };
        } else {
          setOnlineStatus(OnlineStatusUser.UNKNOWN);
        }
      }
    }
  }, [activeChannels, pinnedChannels, userId]);

  return onlineStatus;
}
