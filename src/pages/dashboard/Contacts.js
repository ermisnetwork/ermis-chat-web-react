import React, { useMemo, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { MagnifyingGlass } from 'phosphor-react';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { ChatType, RoleMember } from '../../constants/commons-const';
import ContactElement from '../../components/ContactElement';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';

const Contacts = () => {
  const theme = useTheme();
  const { activeChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const renderedContacts = useMemo(() => {
    const directChannels = activeChannels.filter(channel => {
      const isDirect = channel.type === ChatType.MESSAGING;
      const otherMember = Object.values(channel.state.members).find(member => member.user_id !== user_id);
      return isDirect && otherMember && otherMember.channel_role === RoleMember.OWNER;
    });

    // Lọc theo searchQuery
    const filteredChannels = directChannels.filter(channel => {
      const name = channel.data.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Group by first letter of channel name (case-insensitive)
    const grouped = filteredChannels.reduce((acc, channel) => {
      const name = channel.data.name || '';
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
                  fontSize: '16px',
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                {letter}
              </Typography>
              {grouped[letter].map(item => (
                <div className="channelItem" key={`channel-${item.id}`}>
                  <ContactElement channel={item} />
                </div>
              ))}
            </div>
          ))}
        </>
      );
    } else {
      return (
        <div key="no-channels">
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.palette.text.secondary,
              fontWeight: 400,
            }}
          >
            No contacts found.
          </Typography>
        </div>
      );
    }
  }, [activeChannels, user_id, searchQuery, theme]);

  return (
    <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
      <Stack spacing={2}>
        <Search>
          <SearchIconWrapper>{<MagnifyingGlass size={18} />}</SearchIconWrapper>
          <StyledInputBase
            placeholder="Search"
            inputProps={{ 'aria-label': 'search' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </Search>
      </Stack>

      <Stack
        className="customScrollbar"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'calc(100% - 167px)',
          marginLeft: '-15px!important',
          marginRight: '-15px!important',
          marginTop: '0px!important',
          padding: '15px',
        }}
      >
        <Stack spacing={2}>{renderedContacts}</Stack>
      </Stack>
    </Stack>
  );
};

export default Contacts;
