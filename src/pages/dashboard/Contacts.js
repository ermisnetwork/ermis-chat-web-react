import React, { useMemo } from 'react';
import { Stack, Typography, Box, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { ChatType, ContactType } from '../../constants/commons-const';
import ContactElement from '../../components/ContactElement';
import BoxContainer from '../../layouts/dashboard/BoxContainer';
import NoResult from '../../assets/Illustration/NoResult';
import InviteElement from '../../components/InviteElement';
import useResponsive from '../../hooks/useResponsive';
import { CaretLeft } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import FriendList from '../../sections/dashboard/FriendList';
import { SetSearchQuery } from '../../redux/slices/app';
import { DEFAULT_PATH } from '../../config';

const Contacts = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { activeChannels, pendingChannels } = useSelector(state => state.channel);
  const { searchQuery } = useSelector(state => state.app);
  const { user_id } = useSelector(state => state.auth);
  const isMobileToLg = useResponsive('down', 'lg');
  const isMobileToMd = useResponsive('down', 'md');

  const hash = window.location.hash;
  const currentHash = hash.replace('#', '');

  const onSelectChannel = channel => {
    navigate(`${DEFAULT_PATH}/${channel.type}:${channel.id}`);
    dispatch(SetSearchQuery(''));
  };

  const renderedContacts = useMemo(() => {
    let channels = [];
    const replaceHash = hash.replace('#', '');

    if (replaceHash === ContactType.Channels) {
      channels = activeChannels.filter(channel => channel.type === ChatType.TEAM);
    } else if (replaceHash === ContactType.Request) {
      channels = pendingChannels;
    }

    const filteredChannels = channels.filter(channel => {
      const name = channel.data?.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Nếu là Request thì render danh sách pendingChannels
    if (replaceHash === ContactType.Request) {
      if (filteredChannels.length > 0) {
        return (
          <>
            {filteredChannels.map(item => (
              <Box key={`channel-${item.id}`} sx={{ marginBottom: '15px', width: isMobileToLg ? '100%' : '650px' }}>
                <InviteElement channel={item} />
              </Box>
            ))}
          </>
        );
      } else {
        return (
          <Stack
            key="no-requests"
            sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <NoResult />
            <Typography
              variant="subtitle2"
              sx={{
                textAlign: 'center',
                fontSize: '20px',
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              No result {searchQuery ? `for "${searchQuery}"` : ''}
            </Typography>
          </Stack>
        );
      }
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
                    avatarSize={60}
                    primaryFontSize="18px"
                    secondaryFontSize="14px"
                    onSelect={({ channel, user }) => onSelectChannel(channel)}
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
          <NoResult />
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontSize: '20px',
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            No result {searchQuery ? `for "${searchQuery}"` : ''}
          </Typography>
        </Stack>
      );
    }
  }, [activeChannels, pendingChannels, user_id, searchQuery, hash, theme]);

  if (!hash) return null;

  return (
    <BoxContainer>
      <Stack
        sx={{
          padding: isMobileToMd ? '15px' : '30px',
          width: '100%',
          height: '100%',
        }}
      >
        {isMobileToMd && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              padding: '0px 15px 15px',
              borderBottom: `1px solid ${theme.palette.divider}`,
              margin: '0 -15px 15px',
            }}
          >
            <IconButton
              onClick={() => {
                window.location.hash = '';
                navigate('/contacts');
              }}
            >
              <CaretLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '20px',
                marginLeft: '10px',
              }}
            >
              {currentHash === ContactType.Friends
                ? 'Friends list'
                : currentHash === ContactType.Channels
                  ? 'Channels list'
                  : 'Friend/Channel Request'}
            </Typography>
          </Stack>
        )}
        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            margin: '0px -30px',
            padding: '0px 30px',
          }}
        >
          {currentHash === ContactType.Friends ? (
            <FriendList
              searchQuery={searchQuery}
              noResultWidth={300}
              noResultHeight={300}
              noResultFontSize="20px"
              avatarSize={60}
              primaryFontSize="18px"
              secondaryFontSize="14px"
              onSelect={({ channel, user }) => onSelectChannel(channel)}
            />
          ) : (
            renderedContacts
          )}
        </Stack>
      </Stack>
    </BoxContainer>
  );
};

export default Contacts;
