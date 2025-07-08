import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Button, Dialog, DialogContent, DialogTitle, Slide, Stack } from '@mui/material';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField } from '../../components/hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { ChatType } from '../../constants/commons-const';
import { LoadingButton } from '@mui/lab';
import { showSnackbar } from '../../redux/slices/app';
import { CloseDialogCreateChannel } from '../../redux/slices/dialog';
import RHFAutocompleteFriends from '../../components/hook-form/RHFAutocompleteFriends';
import { FetchFriends } from '../../redux/slices/member';
import RHFRadio from '../../components/hook-form/RHFRadio';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CreateGroupForm = ({ onCloseDialogCreateChannel }) => {
  const dispatch = useDispatch();

  const { user_id } = useSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(FetchFriends());
  }, []);

  const NewGroupSchema = Yup.object().shape({
    name: Yup.string().required('Channel name is required'),

    members: Yup.array().min(1, 'Must have at least 1 members'),
  });

  const defaultValues = {
    public: 'false',
    name: '',
    members: [],
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const { reset, handleSubmit } = methods;

  const onSubmit = async data => {
    try {
      const channel_name = data.name;
      const members = data.members.map(member => member.id);
      const payload = {
        name: channel_name,
        members: [...members, user_id],
        public: data.public === 'true',
      };

      setIsLoading(true);
      const channel = await client.channel(ChatType.TEAM, payload);

      const response = await channel.create();

      if (response) {
        reset();
        setIsLoading(false);
        onCloseDialogCreateChannel();
        dispatch(showSnackbar({ severity: 'success', message: 'Invitation sent' }));
      }
    } catch (error) {
      reset();
      setIsLoading(false);
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to send invite. Please retry' }));
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFRadio
          row
          name="public"
          options={[
            { value: 'false', label: 'Private' },
            { value: 'true', label: 'Public' },
          ]}
        />
        <RHFTextField name="name" label="Name" />
        <RHFAutocompleteFriends
          name="members"
          label="Friends"
          multiple
          ChipProps={{ size: 'medium' }}
          getOptionDisabled={option => option.id === user_id}
        />
        <Stack spacing={2} direction={'row'} alignItems="center" justifyContent={'end'}>
          <Button
            onClick={() => {
              reset();
              onCloseDialogCreateChannel();
            }}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isLoading}>
            Create
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

const CreateChannel = () => {
  const dispatch = useDispatch();
  const { openDialogCreateChannel } = useSelector(state => state.dialog);

  const onCloseDialogCreateChannel = () => {
    dispatch(CloseDialogCreateChannel());
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialogCreateChannel}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialogCreateChannel}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      <DialogTitle>{'Create new channel'}</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        <CreateGroupForm onCloseDialogCreateChannel={onCloseDialogCreateChannel} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannel;
