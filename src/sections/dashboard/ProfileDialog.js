import React, { useCallback, useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Slide, Stack } from '@mui/material';

import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField, RHFUploadAvatar } from '../../components/hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { CloseDialogProfile } from '../../redux/slices/dialog';
import { UpdateUserProfile } from '../../redux/slices/member';
import { showSnackbar } from '../../redux/slices/app';
import { useNavigate } from 'react-router-dom';
import { PATH_DASHBOARD } from '../../routes/paths';
import { processImageFile } from '../../utils/commons';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ProfileForm = ({ onCloseDialog, openDialogProfile }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const { myUserInfo } = useSelector(state => state.member);
  const { isLoading } = useSelector(state => state.app);
  const { user_id } = useSelector(state => state.auth);

  useEffect(() => {
    if (!openDialogProfile) {
      setFile(null);
      reset(defaultValues);
    }
  }, [openDialogProfile]);

  const defaultValues = {
    name: myUserInfo?.name,
    about_me: myUserInfo?.about_me || '',
    avatar: myUserInfo?.avatar,
  };

  const methods = useForm({
    defaultValues,
  });

  const { reset, setValue, handleSubmit } = methods;

  const onSubmit = async data => {
    try {
      dispatch(
        UpdateUserProfile({
          name: data?.name ? data?.name : user_id,
          about_me: data?.about_me || '',
          avatar: file,
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDrop = useCallback(
    async acceptedFiles => {
      const file = acceptedFiles[0];
      const isImage = file.type.startsWith('image/');

      if (!isImage) {
        dispatch(showSnackbar({ severity: 'error', message: 'Please upload an image file!' }));
        setFile(null);
      } else {
        const fileCompress = await processImageFile(file, true);

        if (fileCompress) {
          setFile(fileCompress);
          const newFile = Object.assign(fileCompress, {
            preview: URL.createObjectURL(fileCompress),
          });
          if (fileCompress) {
            setValue('avatar', newFile, { shouldValidate: true });
          }
        }
      }
    },
    [setValue],
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFUploadAvatar name="avatar" onDrop={handleDrop} />

        <RHFTextField name="name" label="Name" placeholder={user_id} />
        <RHFTextField multiline rows={4} name="about_me" label="About me" />
        <Stack spacing={2} direction={'row'} alignItems="center" justifyContent="space-between">
          <Button
            onClick={() => {
              navigate(PATH_DASHBOARD.deleteAccount);
              onCloseDialog();
            }}
            color="inherit"
            variant="contained"
          >
            Delete account
          </Button>
          <Stack spacing={2} direction={'row'} alignItems="center" justifyContent={'end'}>
            <Button
              onClick={() => {
                reset(defaultValues);
                onCloseDialog();
              }}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isLoading}>
              Save
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

const ProfileDialog = () => {
  const dispatch = useDispatch();
  const { openDialogProfile } = useSelector(state => state.dialog);

  const onCloseDialog = () => {
    dispatch(CloseDialogProfile());
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialogProfile}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      <DialogTitle>{'Profile'}</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        <ProfileForm onCloseDialog={onCloseDialog} openDialogProfile={openDialogProfile} />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
