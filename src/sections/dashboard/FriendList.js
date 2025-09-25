import React, { useEffect, useMemo, useState } from 'react';
import { Stack, Typography, Box, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { ChatType, RoleMember } from '../../constants/commons-const';
import NoResult from '../../assets/Illustration/NoResult';
import ContactElement from '../../components/ContactElement';
import { client } from '../../client';
import { UpdateIsLoading } from '../../redux/slices/app';
import UserElement from '../../components/UserElement';
import { removeVietnameseTones } from '../../utils/commons';

const FriendList = ({
  searchQuery = '',
  noResultWidth = 150,
  noResultHeight = 150,
  noResultFontSize = '14px',
  avatarSize = 44,
  primaryFontSize = '14px',
  secondaryFontSize = '12px',
  selectedUsers = [],
  onCheck = null,
  onSelect = () => {},
  enableUserSearch = false,
  excludedUserIds = [],
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { activeChannels = [], pinnedChannels = [] } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const [searchedUser, setSearchedUser] = useState(null);

  const directChannels = useMemo(() => {
    return [...activeChannels, ...pinnedChannels].filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const otherMember = Object.values(channel.state.members).find(member => member.user_id !== user_id);
      return (
        isDirect &&
        otherMember &&
        otherMember.channel_role === RoleMember.OWNER &&
        !excludedUserIds.includes(otherMember.user_id)
      );
    });
  }, [activeChannels, pinnedChannels, user_id, excludedUserIds]);

  // Gọi API tìm user nếu không có filteredChannels và enableUserSearch=true
  useEffect(() => {
    let ignore = false;
    let debounceTimer;

    const filteredChannels = directChannels.filter(channel => {
      const name = removeVietnameseTones(channel.data?.name.toLowerCase()) || '';
      const searchTerm = removeVietnameseTones(searchQuery.toLowerCase());
      return name.includes(searchTerm);
    });

    if (enableUserSearch && searchQuery && filteredChannels.length === 0) {
      dispatch(UpdateIsLoading({ isLoading: true }));

      const fetchUsers = async () => {
        try {
          const name = searchQuery;
          const page = 1;
          const page_size = 10;
          const result = await client.searchUsers(page, page_size, name);

          if (!ignore) setSearchedUser(result.data[0]);
        } catch (e) {
          if (!ignore) setSearchedUser(null);
        } finally {
          dispatch(UpdateIsLoading({ isLoading: false }));
        }
      };

      debounceTimer = setTimeout(fetchUsers, 400);
    } else {
      setSearchedUser(null);
      dispatch(UpdateIsLoading({ isLoading: false }));
    }

    return () => {
      ignore = true;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, enableUserSearch]);

  const renderedFriends = useMemo(() => {
    const filteredChannels = directChannels.filter(channel => {
      const name = removeVietnameseTones(channel.data?.name.toLowerCase()) || '';
      const searchTerm = removeVietnameseTones(searchQuery.toLowerCase());
      return name.includes(searchTerm);
    });

    // Nếu không có channel và có searchedUsers thì hiển thị searchedUsers
    if (enableUserSearch && filteredChannels.length === 0 && searchedUser) {
      return (
        <>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '20px',
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            {searchedUser.name.charAt(0).toUpperCase()}
          </Typography>
          <Box sx={{ marginBottom: '5px' }}>
            <UserElement
              user={searchedUser}
              avatarSize={avatarSize}
              primaryFontSize={primaryFontSize}
              secondaryFontSize={secondaryFontSize}
              onSelect={onSelect}
            />
          </Box>
        </>
      );
    }

    // Group by first letter of channel name (case-insensitive) cho Friends & Channels
    const grouped = filteredChannels.reduce((acc, channel) => {
      const name = channel.data?.name || '';
      const firstLetter = name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(channel);
      return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort();

    if (sortedKeys.length > 0) {
      return (
        <>
          {sortedKeys.map(letter => (
            <div key={letter}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '20px',
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                {letter}
              </Typography>
              {grouped[letter].map(item => (
                <Box key={`channel-${item.id}`} sx={{ marginBottom: '5px' }}>
                  <ContactElement
                    channel={item}
                    avatarSize={avatarSize}
                    primaryFontSize={primaryFontSize}
                    secondaryFontSize={secondaryFontSize}
                    selectedUsers={selectedUsers}
                    onCheck={onCheck}
                    onSelect={onSelect}
                  />
                </Box>
              ))}
            </div>
          ))}
        </>
      );
    } else {
      return (
        <Stack key="no-channels" sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <NoResult width={noResultWidth} height={noResultHeight} />
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: noResultFontSize,
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            No result {searchQuery ? `for "${searchQuery}"` : ''}
          </Typography>
        </Stack>
      );
    }
  }, [
    activeChannels,
    pinnedChannels,
    user_id,
    theme,
    searchQuery,
    noResultWidth,
    noResultHeight,
    noResultFontSize,
    avatarSize,
    primaryFontSize,
    secondaryFontSize,
    selectedUsers,
    onCheck,
    onSelect,
    enableUserSearch,
    searchedUser,
    directChannels,
  ]);

  return <>{renderedFriends}</>;
};

export default FriendList;
