import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Slide, Stack, IconButton } from '@mui/material';
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

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CreatePollDialog = () => {
  const dispatch = useDispatch();
  const { openCreatePollDialog } = useSelector(state => state.dialog);
  const { currentChannel } = useSelector(state => state.channel);

  const [loadingButton, setLoadingButton] = useState(false);

  const PollSchema = Yup.object().shape({
    question: Yup.string().required('Question is required'),
    options: Yup.array()
      .of(
        Yup.object().shape({
          text: Yup.string().required('Option cannot be empty'),
        }),
      )
      .min(2, 'At least 2 options'),
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
      await currentChannel.createPoll(payload);
      setLoadingButton(false);
      onCloseDialog();
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error);
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
        New Poll
        <IconButton onClick={onCloseDialog}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <RHFTextField name="question" label="Question" style={{ marginTop: '5px' }} />
            <Stack spacing={2}>
              <label style={{ fontWeight: 600 }}>Poll Options</label>

              {fields.map((field, idx) => (
                <Stack key={field.id} direction="row" alignItems="center" spacing={1}>
                  <RHFTextField
                    name={`options[${idx}].text`}
                    label={`Option ${idx + 1}`}
                    fullWidth
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
              <Button
                variant="outlined"
                size="small"
                onClick={() => append({ text: '' })}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Option
              </Button>
            </Stack>

            <RHFCheckbox name="multipleAnswers" label="Multiple answers" />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={onCloseDialog}>Cancel</Button>
              <LoadingButton type="submit" variant="contained" loading={loadingButton}>
                Create
              </LoadingButton>
            </Stack>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
