import React, { useCallback, useEffect, useState } from 'react';
import { Box, IconButton, styled, Typography, useTheme, Stack, alpha, Divider } from '@mui/material';
import { ArrowLeft, MagnifyingGlass } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../ChannelAvatar';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { DEFAULT_PATH } from '../../config';
import { useNavigate } from 'react-router-dom';
import { client } from '../../client';
import { debounce } from '@mui/material/utils';
import { LoadingSpinner } from '../animate';
import AvatarComponent from '../AvatarComponent';
import { splitChannelId } from '../../utils/commons';
import { AvatarShape, ChatType } from '../../constants/commons-const';
import { setSearchChannels } from '../../redux/slices/channel';

const StyledSearchItem = styled(Box)(({ theme }) => ({
  transition: 'all .1s',
  width: '100%',
  borderRadius: '8px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor:
      theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.5) : theme.palette.primary.main,
  },
}));

const HomeSearch = ({ channels }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { searchChannels } = useSelector(state => state.channel);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocalChannels, setFilteredLocalChannels] = useState([]);
  const [publicChannels, setPublicChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const users = client.state.users ? Object.values(client.state.users) : [];

  useEffect(() => {
    if (channels.length) {
      const dataChannels = channels.map(channel => {
        let name = '';
        const channelData = channel.data;
        if (channelData.type === ChatType.MESSAGING) {
          const otherMember = channelData.members.find(member => member.user_id !== user_id);
          if (otherMember) {
            const otherUser = users.find(user => user.id === otherMember.user_id);
            if (otherUser) {
              name = otherUser.name;
            }
          }
        } else {
          name = channelData.name;
        }

        return {
          type: channelData.type,
          id: channelData.id,
          name,
          image: channelData.image,
          public: channelData.public,
        };
      });

      dispatch(setSearchChannels(dataChannels));
    }
  }, [channels, user_id]);

  const debouncedSearch = useCallback(
    debounce(async term => {
      if (term) {
        const response = await client.searchPublicChannel(term);
        if (response) {
          setPublicChannels(response.search_result.channels);

          const results =
            searchChannels.filter(channel => channel.name.toLowerCase().includes(term.toLowerCase())) || [];
          setFilteredLocalChannels(results);
          setLoading(false);
        }
      } else {
        setLoading(false);
        setPublicChannels([]);
        setFilteredLocalChannels([]);
      }
    }, 300),
    [searchChannels],
  );

  const onFocusSearch = () => {
    setVisible(true);
  };

  const onChangeSearch = async event => {
    const query = event.target.value;
    setLoading(true);

    setSearchQuery(query);
    debouncedSearch(query);
  };

  const onCloseSearch = () => {
    setVisible(false);
    setSearchQuery('');
    setFilteredLocalChannels([]);
    setPublicChannels([]);
    setLoading(false);
  };

  const onSelectItem = (channelId, channelType) => {
    navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
    onCloseSearch();
  };

  return (
    <>
      <Stack sx={{ width: '100%', position: 'relative', zIndex: 3 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          {visible && (
            <IconButton onClick={onCloseSearch}>
              <ArrowLeft />
            </IconButton>
          )}

          <Search>
            <SearchIconWrapper>
              {loading ? <LoadingSpinner size={18} /> : <MagnifyingGlass size={18} />}
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search channel"
              inputProps={{ 'aria-label': 'search' }}
              onFocus={onFocusSearch}
              onChange={onChangeSearch}
              value={searchQuery}
              sx={{ height: '48px' }}
            />
          </Search>
        </Stack>
      </Stack>
      <Box
        sx={{
          marginTop: '0px !important',
          padding: '15px',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
          borderRadius: '16px',
          display: visible ? 'block' : 'none',
        }}
      >
        <Stack
          sx={{ flexGrow: 1, overflowY: 'auto', marginTop: '63px', height: 'calc(100% - 63px)' }}
          className="customScrollbar"
        >
          <Stack spacing={2}>
            {/* -------------------------------------------Your channels---------------------------------- */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: theme.palette.text.secondary, marginBottom: '10px', fontWeight: 600 }}
              >
                Your channels
              </Typography>
              {filteredLocalChannels.length ? (
                <Stack spacing={1}>
                  {filteredLocalChannels.map(channel => {
                    const dataChannel = channels.find(it => it.data.id === channel.id);
                    const isPublic = channel.type === ChatType.TEAM && channel.public;
                    const channelId = channel.id;
                    const channelType = channel.type;
                    return (
                      <StyledSearchItem
                        key={channel.id}
                        sx={{
                          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
                        }}
                        onClick={() => onSelectItem(channelId, channelType)}
                      >
                        <Stack
                          direction="row"
                          alignItems={'center'}
                          justifyContent="space-between"
                          sx={{ padding: '12px' }}
                        >
                          {isPublic ? (
                            <AvatarComponent
                              name={channel.name}
                              url={channel.image}
                              width={40}
                              height={40}
                              isPublic={isPublic}
                              shape={AvatarShape.Round}
                            />
                          ) : (
                            <ChannelAvatar channel={dataChannel} width={40} height={40} />
                          )}
                          <Stack sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {channel.name}
                            </Typography>
                          </Stack>
                        </Stack>
                      </StyledSearchItem>
                    );
                  })}
                </Stack>
              ) : (
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
                  No result
                </Typography>
              )}
            </Box>

            <Divider />

            {/* -------------------------------------------Public channels---------------------------------- */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: theme.palette.text.secondary, marginBottom: '10px', fontWeight: 600 }}
              >
                Public channels
              </Typography>
              {publicChannels.length ? (
                <Stack spacing={1}>
                  {publicChannels.map(channel => {
                    const splitCID = splitChannelId(channel.cid);
                    const channelId = splitCID.channelId;
                    const channelType = splitCID.channelType;
                    return (
                      <StyledSearchItem
                        key={channel.cid}
                        sx={{
                          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
                        }}
                        onClick={() => onSelectItem(channelId, channelType)}
                      >
                        <Stack
                          direction="row"
                          alignItems={'center'}
                          justifyContent="space-between"
                          sx={{ padding: '12px' }}
                        >
                          <AvatarComponent
                            name={channel.name}
                            url={channel.image}
                            width={40}
                            height={40}
                            isPublic={true}
                            shape={AvatarShape.Round}
                          />
                          <Stack sx={{ width: 'calc(100% - 40px)', paddingLeft: '15px' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {channel.name}
                            </Typography>
                          </Stack>
                        </Stack>
                      </StyledSearchItem>
                    );
                  })}
                </Stack>
              ) : (
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
                  No result
                </Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default HomeSearch;
