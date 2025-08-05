import React, { useEffect, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { CaretLeft } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import { LoadingButton } from '@mui/lab';
import RHFRadio from '../../components/hook-form/RHFRadio';
import { handleError } from '../../utils/commons';
import FormProvider from '../../components/hook-form';
import { useForm } from 'react-hook-form';
import { SidebarType } from '../../constants/commons-const';
import { DOMAIN_APP } from '../../config';

const SidebarChannelType = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const formSubmitRef = useRef(null);
  const { currentChannel } = useSelector(state => state.channel);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const fullUrl = `${DOMAIN_APP}/channels/${currentChannel?.cid}`;

  const defaultValues = {
    public: String(currentChannel.data.public),
  };

  const methods = useForm({
    mode: 'onChange',
    defaultValues,
  });

  const { watch, handleSubmit } = methods;

  const onSaveClick = () => {
    if (formSubmitRef.current) formSubmitRef.current();
  };

  const onSubmit = async data => {
    try {
      const params = {};
      if (data.public !== defaultValues.public) {
        params.public = data.public === 'true';
      }

      setSaveLoading(true);
      await currentChannel.update(params);
      dispatch(showSnackbar({ severity: 'success', message: 'Channel updated successfully' }));
      dispatch(UpdateSidebarType(SidebarType.Channel));
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setSaveLoading(false);
    }
  };

  const watchValues = () => {
    const data = watch();
    return {
      public: data.public,
    };
  };

  useEffect(() => {
    if (formSubmitRef) {
      formSubmitRef.current = handleSubmit(onSubmit);
    }
  }, [formSubmitRef, handleSubmit, onSubmit]);

  useEffect(() => {
    const noChanges = watchValues().public === defaultValues.public;
    setSaveDisabled(noChanges);
  }, [watchValues, defaultValues]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      dispatch(showSnackbar({ severity: 'success', message: 'Copied to clipboard' }));
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Unable to copy the link. Please try again' }));
    }
  };

  if (!currentChannel) return null;

  return (
    <>
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
            Channel Type
          </Typography>

          <LoadingButton
            variant="text"
            size="small"
            onClick={onSaveClick}
            disabled={saveDisabled}
            loading={saveLoading}
          >
            SAVE
          </LoadingButton>
        </Stack>

        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            width: '100%',
            height: '100%',
            position: 'relative',
            padding: '24px',
          }}
          spacing={3}
        >
          <Stack sx={{ width: '100%' }}>
            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme => theme.palette.text.primary,
                    marginBottom: '5px',
                  }}
                >
                  TYPE
                </Typography>
                <RHFRadio
                  name="public"
                  options={[
                    { value: 'true', label: 'Public' },
                    { value: 'false', label: 'Private' },
                  ]}
                  labelPlacement="start"
                  optionSx={{
                    justifyContent: 'space-between',
                    marginLeft: 0,
                    marginRight: 0,
                    padding: '15px 0',
                    borderBottom: theme => `1px solid ${theme.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                    '& .MuiTypography-root': {
                      fontSize: '16px',
                    },
                    '& .MuiRadio-root': {
                      padding: '0px',
                    },
                  }}
                  controlSx={{
                    border: theme => `1px solid ${theme.palette.divider}`,
                    borderRadius: '16px',
                    p: '0px 15px',
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme => theme.palette.text.secondary,
                    marginTop: '5px',
                  }}
                >
                  {methods.watch('public') === 'true'
                    ? 'Public channel is open for anyone to search, view its content, and join.'
                    : 'Only invited members can find and join a private channel.'}
                </Typography>
              </Box>
            </FormProvider>
          </Stack>

          {methods.watch('public') === 'true' && (
            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                INVITE LINK
              </Typography>

              <Stack
                gap={2}
                sx={{
                  padding: '15px',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: '16px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '16px',
                    color: theme => theme.palette.text.primary,
                    backgroundColor: theme => theme.palette.background.neutral,
                    padding: '12px',
                    borderRadius: '10px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {fullUrl}
                </Typography>

                <Button
                  variant="text"
                  size="large"
                  onClick={onCopy}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    color: theme.palette.primary.main,
                  }}
                  fullWidth
                >
                  COPY
                </Button>
              </Stack>

              <Typography
                sx={{
                  fontSize: '12px',
                  color: theme => theme.palette.text.secondary,
                  marginTop: '5px',
                }}
              >
                Enable others to find the channel by sharing its link.
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default SidebarChannelType;
