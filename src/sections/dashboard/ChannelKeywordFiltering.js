import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, IconButton, Stack, TextField, Typography, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { ArrowLeft, Check, X } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import { SidebarType } from '../../constants/commons-const';
import { SetFilterWords } from '../../redux/slices/channel';
import { handleError } from '../../utils/commons';

const StyledBoxActions = styled(Box)(({ theme }) => ({
  borderRadius: '8px',
  padding: '15px',
  backgroundColor: theme.palette.background.paper,
}));

const ChannelKeywordFiltering = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel, filterWords } = useSelector(state => state.channel);
  const [loadingButton, setLoadingButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    setKeywords(filterWords);
  }, [filterWords]);

  const onCancel = () => {
    setIsOpen(false);
    setInputValue('');
    setMessageError('');
  };

  const onAddKeyword = () => {
    const trimmedValue = inputValue.trim().toLowerCase();

    if (trimmedValue.length <= 3) {
      setMessageError('Keyword must be more than 3 characters');
      return;
    }

    if (keywords.includes(trimmedValue)) {
      setMessageError('Keyword already exists in the list');
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

  const onSave = async () => {
    try {
      setLoadingButton(true);
      const response = await currentChannel.update({ filter_words: keywords });
      if (response) {
        dispatch(SetFilterWords(response.channel.filter_words || []));
        dispatch(
          showSnackbar({
            severity: 'success',
            message: 'Keywords added successfully!',
          }),
        );
        setLoadingButton(false);
      }
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error);
    }
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
          sx={{ height: '100%' }}
          direction="row"
          alignItems={'center'}
          spacing={2}
          p={2}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems={'center'} spacing={2}>
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType(SidebarType.Channel));
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
              Keywords
            </Typography>
          </Stack>

          <LoadingButton
            loading={loadingButton}
            variant="contained"
            size="small"
            color="primary"
            sx={{ borderRadius: '32px' }}
            disabled={JSON.stringify(keywords) === JSON.stringify(filterWords)}
            onClick={onSave}
          >
            Save
          </LoadingButton>
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
        <Stack sx={{ width: '100%', height: '100%' }} spacing={2}>
          <div style={{ overflowY: 'auto', height: '100%' }} className="customScrollbar">
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  On this channels
                </Typography>
                <StyledBoxActions>
                  {keywords.length ? (
                    keywords.map((keyword, index) => {
                      return (
                        <Box display="flex" alignItems="center" justifyContent="space-between" key={index}>
                          <Typography sx={{ fontSize: '14px' }}>
                            {index + 1}. {keyword}
                          </Typography>
                          <IconButton onClick={() => onRemoveKeyword(index)}>
                            <X size={16} color="red" />
                          </IconButton>
                        </Box>
                      );
                    })
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
                      No keyword
                    </Typography>
                  )}
                </StyledBoxActions>
                {isOpen ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', marginTop: '10px' }}>
                    <TextField
                      autoFocus
                      placeholder="keyword"
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      fullWidth
                      size="small"
                      error={messageError.length}
                      helperText={messageError ? messageError : ''}
                      sx={{ fontSize: '14px', backgroundColor: theme.palette.background.paper }}
                    />
                    <Stack direction="row">
                      <IconButton onClick={onCancel}>
                        <X size={16} color="red" />
                      </IconButton>
                      <IconButton onClick={onAddKeyword}>
                        <Check size={16} color="green" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ) : (
                  <Button
                    variant="text"
                    sx={{ fontSize: '14px', marginTop: '10px', textTransform: 'initial' }}
                    onClick={() => setIsOpen(true)}
                  >
                    + Add new keyword
                  </Button>
                )}

                <Typography
                  sx={{ fontSize: '12px', fontWeight: 400, marginTop: '5px', color: theme.palette.text.secondary }}
                >
                  Add keywords to automatically delete messages with unwanted content in this channel
                </Typography>
              </Box>
            </Stack>
          </div>
        </Stack>
      </Stack>
    </>
  );
};

export default ChannelKeywordFiltering;
