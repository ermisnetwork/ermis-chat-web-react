import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography, debounce, styled } from '@mui/material';
import { MagnifyingGlass, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebar } from '../../redux/slices/app';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { formatString, handleError } from '../../utils/commons';
import MemberAvatar from '../../components/MemberAvatar';
import { getDisplayDate } from '../../utils/formatTime';
import { setSearchMessageId } from '../../redux/slices/messages';
import { SidebarType } from '../../constants/commons-const';

const StyledMessageItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: '15px',
  cursor: 'pointer',
  transition: 'all .1s',
  backgroundColor: theme.palette.background.paper,
  padding: '15px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  '& .MuiBox-root': {
    width: 'calc(100% - 32px)',
    paddingLeft: '10px',
  },
}));

const LIMIT = 25;

const ChannelSearch = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);

  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadSearch = async (value, offset) => {
    try {
      const response = await currentChannel.searchMessage(value, offset);

      if (response) {
        const messages = response.messages;
        setMessages(prev => (offset === 0 ? messages : [...prev, ...messages]));
        setHasMore(offset + LIMIT <= response.total);
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const debouncedLoad = useCallback(
    debounce((value, offset) => {
      loadSearch(value, offset);
    }, 300),
    [],
  );

  const onSearchMessage = event => {
    const searchValue = event.target.value;
    if (searchValue) {
      setSearchTerm(searchValue);
      setOffset(0);
      debouncedLoad(searchValue, 0);
    } else {
      setSearchTerm('');
      setMessages([]);
      setOffset(0);
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
    <>
      <Box
        sx={{
          width: '100%',
          height: '74px',
        }}
      >
        <Stack
          sx={{ height: '100%', p: 2 }}
          direction="row"
          alignItems={'center'}
          justifyContent="space-between"
          spacing={3}
        >
          <Typography variant="subtitle2">Search message</Typography>
          <IconButton
            onClick={() => {
              dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
              dispatch(setSearchMessageId(''));
            }}
          >
            <X />
          </IconButton>
        </Stack>
      </Box>
      <Stack
        sx={{
          height: 'calc(100% - 74px)',
          position: 'relative',
          flexGrow: 1,
        }}
        spacing={2}
        p={2}
      >
        <Stack sx={{ width: '100%', height: '100%' }}>
          <Box>
            <Search sx={{ margin: '0 0 15px' }}>
              <SearchIconWrapper>
                <MagnifyingGlass color="#709CE6" />
              </SearchIconWrapper>
              <StyledInputBase
                autoFocus
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
                onChange={onSearchMessage}
                value={searchTerm}
              />
            </Search>
          </Box>

          <div
            style={{ overflowY: 'auto', height: 'calc(100% - 54px)' }}
            onScroll={handleScroll}
            className="customScrollbar"
          >
            {messages.length > 0 ? (
              <>
                {messages.map(item => {
                  const name = formatString(item.user?.name || item.user_id);
                  return (
                    <StyledMessageItem key={item.id} onClick={() => onClickMessage(item)}>
                      <MemberAvatar member={item.user} width={32} height={32} />
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{
                              width: 'calc(100% - 66px)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {name}
                          </span>
                          <span
                            style={{
                              color: theme.palette.grey[500],
                              fontWeight: 400,
                              fontSize: '12px',
                              width: '66px',
                              textAlign: 'right',
                            }}
                          >
                            {getDisplayDate(item.created_at)}
                          </span>
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {highlightSearchTerm(item.text, searchTerm)}
                        </Typography>
                      </Box>
                    </StyledMessageItem>
                  );
                })}
              </>
            ) : (
              <Typography
                sx={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                }}
              >
                No messages found
              </Typography>
            )}
          </div>
        </Stack>
      </Stack>
    </>
  );
};

export default ChannelSearch;
