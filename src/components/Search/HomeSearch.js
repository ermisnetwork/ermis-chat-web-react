import React, { useCallback, useEffect, useState } from 'react';
import { Box, IconButton, styled, Typography, useTheme, Stack, alpha, Divider } from '@mui/material';
import { ArrowLeft, MagnifyingGlass } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../ChannelAvatar';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { DEFAULT_PATH, TRANSITION } from '../../config';
import { useNavigate } from 'react-router-dom';
import { client } from '../../client';
import { debounce } from '@mui/material/utils';
import { LoadingSpinner } from '../animate';
import AvatarComponent from '../AvatarComponent';
import { removeVietnameseTones, splitChannelId } from '../../utils/commons';
import { AvatarShape, ChatType } from '../../constants/commons-const';
import { setSearchChannels } from '../../redux/slices/channel';
import { SetOpenHomeSearch } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';

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

const HomeSearch = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { openHomeSearch } = useSelector(state => state.app);
  const { searchChannels, activeChannels = [] } = useSelector(state => state.channel);
  const { openTopicPanel } = useSelector(state => state.topic);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocalChannels, setFilteredLocalChannels] = useState([]);
  const [publicChannels, setPublicChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const users = client.state.users ? Object.values(client.state.users) : [];

  useEffect(() => {
    if (activeChannels.length) {
      const dataChannels = activeChannels.map(channel => {
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
  }, [activeChannels, user_id]);

  function removeVietnameseTones(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  const debouncedSearch = useCallback(
    debounce(async term => {
      if (term) {
        const response = await client.searchPublicChannel(term);
        if (response) {
          setPublicChannels(response.search_result.channels);

          const searchTerm = removeVietnameseTones(term.toLowerCase());
          const results =
            searchChannels.filter(channel => removeVietnameseTones(channel.name.toLowerCase()).includes(searchTerm)) ||
            [];
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
    dispatch(SetOpenHomeSearch(true));
  };

  const onChangeSearch = async event => {
    const query = event.target.value;
    setLoading(true);

    setSearchQuery(query);
    debouncedSearch(query);
  };

  const onCloseSearch = () => {
    setSearchQuery('');
    setFilteredLocalChannels([]);
    setPublicChannels([]);
    setLoading(false);
    dispatch(SetOpenHomeSearch(false));
  };

  const onSelectItem = (channelId, channelType) => {
    navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
    onCloseSearch();
  };

  return (
    <>
      <Stack
        sx={{
          width: '100%',
          position: 'relative',
          zIndex: 4,
          transition: TRANSITION,
          opacity: openTopicPanel ? 0.5 : 1,
          pointerEvents: openTopicPanel ? 'none' : 'auto',
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          {openHomeSearch && (
            <IconButton onClick={onCloseSearch}>
              <ArrowLeft />
            </IconButton>
          )}

          <Search>
            <SearchIconWrapper>
              {loading ? (
                <LoadingSpinner size={18} color={theme.palette.text.primary} />
              ) : (
                <MagnifyingGlass size={18} color={theme.palette.text.primary} />
              )}
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('Homesearch.search')}
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
          zIndex: 3,
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
          borderRadius: '16px',
          display: openHomeSearch ? 'block' : 'none',
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
                {t('Homesearch.your_channel')}
              </Typography>
              {filteredLocalChannels.length ? (
                <Stack spacing={1}>
                  {filteredLocalChannels.map(channel => {
                    const dataChannel = activeChannels.find(it => it.data.id === channel.id);
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
                          <ChannelAvatar channel={dataChannel} width={40} height={40} shape={AvatarShape.Round} />
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
                  {t('noResult')}
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
                {t('Homesearch.public_channel')}
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
                  {t('noResult')}
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
