import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { IconButton, Stack, Typography, Box, TextField, InputAdornment } from '@mui/material';
import { CaretLeft, X } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar, UpdateSidebarType } from '../../redux/slices/app';
import { SidebarType } from '../../constants/commons-const';
import { handleError } from '../../utils/commons';
import { LoadingButton } from '@mui/lab';
import { SmallCapsIcon } from '../../components/Icons';
import { SetFilterWords } from '../../redux/slices/channel';
import { useTranslation } from 'react-i18next';

const SidebarKeywords = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentChannel, filterWords } = useSelector(state => state.channel);
  const [loadingButton, setLoadingButton] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    setKeywords(filterWords);
  }, [filterWords]);

  const onAddKeyword = () => {
    const trimmedValue = inputValue.trim().toLowerCase();

    if (trimmedValue.length <= 3) {
      setMessageError(t('sidebarKeywordFiltering.max_characters'));
      return;
    }

    if (keywords.includes(trimmedValue)) {
      setMessageError(t('sidebarKeywordFiltering.keyword_exists'));
      return;
    }

    setKeywords([...keywords, trimmedValue]);
    setInputValue('');
    setMessageError('');
  };

  const onRemoveKeyword = index => {
    setKeywords(keywords.filter((keyword, idx) => idx !== index));
  };

  const handleInputChange = event => {
    setInputValue(event.target.value);
    setMessageError('');
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      onAddKeyword();
    }
  };

  const onSaveClick = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChannel.update({ filter_words: keywords });
      if (response) {
        dispatch(SetFilterWords(response.channel.filter_words || []));
        dispatch(
          showSnackbar({
            severity: 'success',
            message: t('sidebarKeywordFiltering.add_success'),
          }),
        );
        setLoadingButton(false);
      }
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error, t);
    }
  };

  return (
    <Stack sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <IconButton
          onClick={() => {
            dispatch(UpdateSidebarType(SidebarType.Channel));
          }}
        >
          <CaretLeft size={20} color={theme.palette.text.primary} />
        </IconButton>

        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          {t('sidebarKeywordFiltering.title')}
        </Typography>

        <LoadingButton
          variant="text"
          size="small"
          onClick={onSaveClick}
          disabled={JSON.stringify(keywords) === JSON.stringify(filterWords)}
          loading={loadingButton}
        >
          {t('sidebarKeywordFiltering.save')}
        </LoadingButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
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
        >
          <Stack spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                {t('sidebarKeywordFiltering.add_keyword')}
              </Typography>

              <TextField
                autoFocus
                placeholder="Keyword"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                fullWidth
                error={!!messageError}
                helperText={messageError ? messageError : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SmallCapsIcon color={theme.palette.text.primary} />
                    </InputAdornment>
                  ),
                  // endAdornment: (
                  //   <InputAdornment position="end">
                  //     <IconButton onClick={onAddKeyword}>
                  //       <Check size={16} color="green" />
                  //     </IconButton>
                  //   </InputAdornment>
                  // ),
                }}
              />

              <Typography
                sx={{ fontSize: '12px', fontWeight: 400, marginTop: '5px', color: theme.palette.text.secondary }}
              >
                {t('sidebarKeywordFiltering.add_message')}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                {t('sidebarKeywordFiltering.on_this_channel')}
              </Typography>

              <Stack
                sx={{
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: '16px',
                  padding: '15px',
                  gap: 1,
                }}
              >
                {keywords.length ? (
                  keywords.map((keyword, index) => {
                    return (
                      <Typography
                        key={index}
                        sx={{
                          fontSize: '16px',
                          color: theme.palette.text.primary,
                          fontWeight: 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 10px',
                          borderRadius: '10px',
                          backgroundColor: theme.palette.background.neutral,
                        }}
                      >
                        <span>
                          {index + 1}. {keyword}
                        </span>

                        <IconButton onClick={() => onRemoveKeyword(index)}>
                          <X size={18} />
                        </IconButton>
                      </Typography>
                    );
                  })
                ) : (
                  <Typography
                    sx={{
                      fontSize: '16px',
                      color: theme.palette.text.primary,
                      fontWeight: 400,
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: theme.palette.background.neutral,
                    }}
                  >
                    {t('sidebarKeywordFiltering.no_keyword')}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarKeywords;
