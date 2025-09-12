import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography, alpha, debounce, styled } from '@mui/material';
import { MagnifyingGlass, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebar } from '../../redux/slices/app';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { formatString, handleError } from '../../utils/commons';
import MemberAvatar from '../../components/MemberAvatar';
import { getDisplayDate } from '../../utils/formatTime';
import { setSearchMessageId } from '../../redux/slices/messages';
import { AvatarShape, SidebarType } from '../../constants/commons-const';
import NoResult from '../../assets/Illustration/NoResult';
import SkeletonChannels from '../../components/SkeletonChannels';

const StyledMessageItem = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  padding: '13px 10px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  },
}));

const LIMIT = 25;

const SidebarSearchMessage = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);

  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  useEffect(() => {
    if (!currentTopic) {
      setSearchTerm('');
      setMessages([]);
      setOffset(0);
      setHasMore(true);
    }
  }, [currentTopic]);

  useEffect(() => {
    if (searchTerm) {
      setLoading(true);
      debouncedLoad(searchTerm, 0);
    }
  }, [searchTerm]);

  const loadSearch = async (value, offset) => {
    try {
      const response = await currentChat.searchMessage(value, offset);
      if (response) {
        const messages = response.messages;
        setMessages(prev => (offset === 0 ? messages : [...prev, ...messages]));
        setHasMore(offset + LIMIT <= response.total);
      } else {
        setMessages([]);
        setHasMore(false);
      }
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedLoad = useCallback(
    debounce((value, offset) => {
      loadSearch(value, offset);
    }, 200),
    [currentChat],
  );

  const onSearchMessage = event => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    setOffset(0);
    if (!searchValue) {
      setMessages([]);
      setHasMore(true);
    }
  };

  const handlePageChange = () => {
    if (hasMore) {
      const nextPage = offset + 25;
      setOffset(nextPage);
      loadSearch(searchTerm, nextPage);
    }
  };

  const handleScroll = event => {
    const bottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;

    if (bottom) {
      handlePageChange();
    }
  };

  const highlightSearchTerm = (text, term) => {
    if (!term) return text;

    // Escape các ký tự đặc biệt để tìm đúng ký tự đó
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.split(regex).map((part, index) => (regex.test(part) ? <mark key={index}>{part}</mark> : part));
  };

  const onClickMessage = message => {
    dispatch(setSearchMessageId(message.id));
  };

  return (
    <Stack sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <Typography variant="subtitle2" sx={{ flex: 1, fontSize: '18px' }}>
          Search Message
        </Typography>

        <IconButton
          onClick={() => {
            dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
            dispatch(setSearchMessageId(''));
          }}
        >
          <X />
        </IconButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
        <Search sx={{ margin: '0 0 15px' }}>
          <SearchIconWrapper>
            <MagnifyingGlass size={18} />
          </SearchIconWrapper>
          <StyledInputBase
            autoFocus
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            onChange={onSearchMessage}
            value={searchTerm}
          />
        </Search>

        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            marginLeft: '-24px!important',
            marginRight: '-24px!important',
            padding: '0 24px',
            minHeight: 'auto',
            flex: 1,
          }}
          onScroll={handleScroll}
        >
          {loading ? (
            <SkeletonChannels />
          ) : messages.length > 0 ? (
            <>
              {messages.map(item => {
                const name = formatString(item.user?.name || item.user_id);
                return (
                  <StyledMessageItem key={item.id} onClick={() => onClickMessage(item)}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
                      <MemberAvatar member={item.user} width={44} height={44} shape={AvatarShape.Round} />

                      <Stack sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            minWidth: 'auto',
                            overflow: 'hidden',
                            fontSize: 14,
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {name}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            minWidth: 'auto',
                            overflow: 'hidden',
                            fontSize: 14,
                            color: theme.palette.text.primary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {highlightSearchTerm(item.text, searchTerm)}
                        </Typography>
                      </Stack>

                      <Typography
                        sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          fontSize: '10px',
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {getDisplayDate(item.created_at)}
                      </Typography>
                    </Stack>
                  </StyledMessageItem>
                );
              })}
            </>
          ) : (
            <Stack sx={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <NoResult width={180} height={180} />
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontSize: 16,
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                No messages found!
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                We couldn’t find any messages. Try a different keyword or share something to get started.
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarSearchMessage;
