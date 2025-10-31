import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Stack,
  IconButton,
  Box,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { setOpenCreatePollDialog } from '../../redux/slices/dialog';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { useFieldArray, useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { X } from 'phosphor-react';
import RHFCheckbox from '../../components/hook-form/RHFCheckbox';
import { handleError } from '../../utils/commons';
import { FlagIcon, PollIcon } from '../../components/Icons';
import Iconify from '../../components/Iconify';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CreatePollDialog = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { openCreatePollDialog } = useSelector(state => state.dialog);
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const [loadingButton, setLoadingButton] = useState(false);

  const PollSchema = Yup.object().shape({
    question: Yup.string().required(t('create_poll.question_required')),
    options: Yup.array()
      .of(
        Yup.object().shape({
          text: Yup.string().required(t('create_poll.question_empty')),
        }),
      )
      .min(2, t('create_poll.min_options')),
    multipleAnswers: Yup.boolean(),
  });

  const defaultValues = {
    question: '',
    options: [{ text: '' }, { text: '' }],
    multipleAnswers: false,
  };

  const methods = useForm({
    resolver: yupResolver(PollSchema),
    defaultValues,
  });

  const { control, handleSubmit, reset } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  useEffect(() => {
    if (openCreatePollDialog) reset(defaultValues);
  }, [openCreatePollDialog]);

  const onCloseDialog = () => {
    dispatch(setOpenCreatePollDialog(false));
    reset(defaultValues);
  };

  const onSubmit = async data => {
    try {
      const payload = {
        text: data.question,
        poll_choices: data.options.map(option => option.text),
        poll_type: data.multipleAnswers ? 'multiple' : 'single',
      };
      setLoadingButton(true);
      await currentChat.createPoll(payload);
      setLoadingButton(false);
      onCloseDialog();
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error, t);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openCreatePollDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
    >
      <DialogTitle sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('create_poll.title')}
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Box>
              <label style={{ fontWeight: 600, fontSize: '12px' }}>{t('create_poll.question')}</label>
              <RHFTextField
                name="question"
                placeholder={t('create_poll.question_name')}
                style={{ marginTop: '5px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PollIcon color={theme.palette.text.primary} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <label style={{ fontWeight: 600, fontSize: '12px' }}>{}{t('create_poll.options')}</label>
              <Stack spacing={2}>
                {fields.map((field, idx) => (
                  <Stack key={field.id} direction="row" alignItems="center" spacing={1}>
                    <RHFTextField
                      name={`options[${idx}].text`}
                      placeholder={`${t('create_poll.option')} ${idx + 1}`}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FlagIcon color={theme.palette.text.primary} />
                          </InputAdornment>
                        ),
                      }}
                      // error={!!errors.options}
                      // helperText={errors.options && errors.options.message}
                    />
                    {fields.length > 2 && (
                      <IconButton onClick={() => remove(idx)} edge="end" size="small" aria-label="remove">
                        <X size={16} />
                      </IconButton>
                    )}
                  </Stack>
                ))}

                <Box>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => append({ text: '' })}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      fontSize: '14px',
                    }}
                    fullWidth
                  >
                    <Iconify icon="ph:plus-bold" width={18} height={18} /> &nbsp; {t('create_poll.add_option')}
                  </Button>
                </Box>
              </Stack>
            </Box>

            <RHFCheckbox name="multipleAnswers" label={t('create_poll.multiple_answers')} />

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button size="large" onClick={onCloseDialog} sx={{ flex: 1 }}>
                {t('create_poll.cancel')}
              </Button>
              <LoadingButton size="large" type="submit" variant="contained" loading={loadingButton} sx={{ flex: 1 }}>
                {t('create_poll.create')}
              </LoadingButton>
            </Stack>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
