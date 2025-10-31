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
import { useTranslation } from 'react-i18next';

const SidebarChannelTopic = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const formSubmitRef = useRef(null);
  const { currentChannel } = useSelector(state => state.channel);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const defaultValues = {
    topicEnabled: String(currentChannel?.data?.topics_enabled),
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
      const enableTopics = data.topicEnabled === 'true';
      setSaveLoading(true);
      enableTopics ? await currentChannel.enableTopics() : await currentChannel.disableTopics();
      dispatch(
        showSnackbar({
          severity: 'success',
          message: `${t('sidebarChannelTopic.title')} ${enableTopics ? t('sidebarChannelTopic.enabled') : t('sidebarChannelTopic.disabled')} ${t('sidebarChannelTopic.success')}.`,
        }),
      );
    } catch (error) {
      handleError(dispatch, error, t);
    } finally {
      setSaveLoading(false);
    }
  };

  const watchValues = () => {
    const data = watch();
    return {
      topicEnabled: data.topicEnabled,
    };
  };

  useEffect(() => {
    if (formSubmitRef) {
      formSubmitRef.current = handleSubmit(onSubmit);
    }
  }, [formSubmitRef, handleSubmit, onSubmit]);

  useEffect(() => {
    const noChanges = watchValues().topicEnabled === defaultValues.topicEnabled;
    setSaveDisabled(noChanges);
  }, [watchValues, defaultValues]);

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
            {t('sidebarChannelTopic.title')}
          </Typography>

          <LoadingButton
            variant="text"
            size="small"
            onClick={onSaveClick}
            disabled={saveDisabled}
            loading={saveLoading}
          >
            {t('sidebarChannelTopic.save')}
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
                  {t('sidebarChannelTopic.topics')}
                </Typography>
                <RHFRadio
                  name="topicEnabled"
                  options={[
                    { value: 'true', label: t('sidebarChannelTopic.Enabled') },
                    { value: 'false', label: t('sidebarChannelTopic.Disabled') },
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
                  {t('sidebarChannelTopic.message')}
                </Typography>
              </Box>
            </FormProvider>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};

export default SidebarChannelTopic;
