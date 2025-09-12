import React, { useState } from 'react';
import * as Yup from 'yup';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Slide,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField } from '../../components/hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { SetOpenNewTopicDialog } from '../../redux/slices/dialog';
import { ChatPurpleIcon } from '../../components/Icons';
import { X } from 'phosphor-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { handleError } from '../../utils/commons';
import { showSnackbar } from '../../redux/slices/app';
import { LoadingButton } from '@mui/lab';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const NewTopicDialog = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { openNewTopicDialog } = useSelector(state => state.dialog);
  const { currentChannel } = useSelector(state => state.channel);
  const [loadingButton, setLoadingButton] = useState(false);

  const onCloseDialog = () => {
    dispatch(SetOpenNewTopicDialog(false));
    reset();
  };

  const NewGroupSchema = Yup.object().shape({
    name: Yup.string().required('Topic name is required'),
  });

  const defaultValues = {
    name: '',
    image: '',
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const { reset, handleSubmit, watch, setValue } = methods;
  const selectedEmoji = watch('image');

  const onSubmit = async data => {
    try {
      setLoadingButton(true);
      const response = await currentChannel.createTopic(data);

      if (response) {
        onCloseDialog();
        dispatch(showSnackbar({ severity: 'success', message: 'Topic created successfully' }));
      }
    } catch (error) {
      handleError(dispatch, error);
    } finally {
      setLoadingButton(false);
    }
  };

  const handleEmojiClick = emoji => {
    setValue('image', `emoji://${emoji.native}`);
  };

  return (
    <>
      <style>{`
        .new-topic-dialog :where(em-emoji-picker) {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          height: 330px !important;
        }
      `}</style>
      <Dialog
        fullWidth
        maxWidth="xs"
        open={openNewTopicDialog}
        TransitionComponent={Transition}
        keepMounted
        onClose={onCloseDialog}
      >
        <DialogTitle sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Start a new topic
          <IconButton onClick={onCloseDialog}>
            <X />
          </IconButton>
        </DialogTitle>

        <DialogContent className="new-topic-dialog">
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme => theme.palette.text.primary,
                    marginBottom: '5px',
                  }}
                >
                  TOPIC NAME
                </Typography>

                <Stack spacing={2}>
                  <RHFTextField
                    name="name"
                    placeholder="What do you want to discuss?"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {selectedEmoji ? (
                            <span style={{ fontSize: 24 }}>
                              {selectedEmoji.startsWith('emoji://')
                                ? selectedEmoji.replace('emoji://', '')
                                : selectedEmoji}
                            </span>
                          ) : (
                            <ChatPurpleIcon />
                          )}
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '16px',
                      },
                    }}
                  />
                </Stack>
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
                  TOPIC ICON
                </Typography>

                <Stack spacing={2}>
                  <Picker
                    theme={theme.palette.mode}
                    data={data}
                    onEmojiSelect={emoji => {
                      handleEmojiClick(emoji);
                    }}
                    previewPosition="none"
                    dynamicWidth
                    searchPosition="none"
                    emojiSize={30}
                    emojiButtonSize={50}
                    emojiButtonRadius="16px"
                    categories={['nature', 'people', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']}
                    styles={{
                      emojiButton: {
                        borderRadius: '16px',
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: '0 0 0 2px #9155fd',
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Stack spacing={2} direction={'row'} alignItems="center">
                <LoadingButton size="large" type="submit" variant="contained" sx={{ flex: 1 }} loading={loadingButton}>
                  CREATE
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewTopicDialog;
