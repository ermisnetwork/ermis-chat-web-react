import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Slide,
  Stack,
  Typography,
  useTheme,
  Chip,
  alpha,
} from '@mui/material';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField } from '../../components/hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { AvatarShape, ChatType } from '../../constants/commons-const';
import { LoadingButton } from '@mui/lab';
import { showSnackbar } from '../../redux/slices/app';
import { CloseDialogCreateChannel } from '../../redux/slices/dialog';
import { FetchFriends } from '../../redux/slices/member';
import RHFRadio from '../../components/hook-form/RHFRadio';
import { EditIcon, UsersIcon } from '../../components/Icons';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search';
import { MagnifyingGlass } from 'phosphor-react';
import FriendList from './FriendList';
import MemberAvatar from '../../components/MemberAvatar';
import { useTranslation } from 'react-i18next';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CreateGroupForm = ({ onCloseDialogCreateChannel, step, setStep }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user_id } = useSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    dispatch(FetchFriends());
  }, []);

  const NewGroupSchema = Yup.object().shape({
    name: Yup.string().required(t('create_channel.channel_required')),
  });

  const defaultValues = {
    public: 'false',
    name: '',
    description: '',
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const { reset, handleSubmit, watch } = methods;
  const description = watch(t('create_channel.description'), '');
  const wordCount = description ? description.trim().length : 0;

  const onSubmit = async data => {
    if (step === 1) {
      setStep(2);
    } else {
      try {
        const channel_name = data.name;
        const memberIds = selectedUsers.map(member => member.id);
        const payload = {
          name: channel_name,
          description: data.description,
          members: [...memberIds, user_id],
          public: data.public === 'true',
        };

        setIsLoading(true);
        const channel = await client.channel(ChatType.TEAM, payload);

        const response = await channel.create();

        if (response) {
          reset();
          setIsLoading(false);
          setSearchQuery('');
          setSelectedUsers([]);
          onCloseDialogCreateChannel();
          dispatch(showSnackbar({ severity: 'success', message: t('create_channel.create_success') }));
        }
      } catch (error) {
        reset();
        setIsLoading(false);
        dispatch(showSnackbar({ severity: 'error', message: t('create_channel.create_failed') }));
      }
    }
  };

  const onBack = () => setStep(1);

  const sxButtonGroupStep2 = {
    position: 'absolute',
    bottom: '-24px',
    left: '-24px',
    right: '-24px',
    zIndex: 1,
    padding: '15px',
    borderTop: theme => `1px solid ${theme.palette.divider}`,
    backdropFilter: 'blur(10px)',
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3} sx={{ position: 'relative' }}>
        {step === 1 ? (
          <>
            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                {t('create_channel.type')}
              </Typography>
              <RHFRadio
                name="public"
                options={[
                  { value: 'true', label: t('create_channel.public') },
                  { value: 'false', label: t('create_channel.private') },
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
                  ? t('create_channel.message_public')
                  : t('create_channel.message_private')
                }
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
                {t('create_channel.info')}
              </Typography>

              <Stack spacing={2}>
                <RHFTextField
                  name="name"
                  placeholder={t('create_channel.channel_name')}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UsersIcon color={theme.palette.text.primary} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '16px',
                    },
                  }}
                />

                <RHFTextField
                  multiline
                  rows={4}
                  name="description"
                  placeholder={t('create_channel.description')}
                  inputProps={{
                    maxLength: 100,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EditIcon color={theme.palette.text.primary} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '16px',
                      alignItems: 'baseline',
                    },
                    '& .MuiFormHelperText-root': {
                      textAlign: 'right',
                      marginRight: '0px',
                    },
                  }}
                  helperText={`${wordCount}/100 ${t('create_channel.words')}`}
                />
              </Stack>
            </Box>

            <Stack spacing={2} direction={'row'} alignItems="center">
              <Button
                size="large"
                onClick={() => {
                  reset();
                  onCloseDialogCreateChannel();
                }}
                sx={{ flex: 1 }}
              >
                {t('create_channel.cancel')}
              </Button>
              <Button size="large" type="submit" variant="contained" sx={{ flex: 1 }}>
                {t('create_channel.next')}
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Search>
              <SearchIconWrapper>{<MagnifyingGlass size={18} />}</SearchIconWrapper>
              <StyledInputBase
                placeholder={t('create_channel.search')}
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{ height: '48px' }}
                autoFocus
              />
            </Search>

            {selectedUsers.length > 0 && (
              <Stack direction="row" flexWrap="wrap">
                {selectedUsers.map(user => (
                  <Chip
                    key={user.id}
                    label={user.name}
                    avatar={<MemberAvatar member={user} width={28} height={28} shape={AvatarShape.Round} />}
                    onDelete={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '12px',
                      height: '36px',
                      paddingLeft: '5px',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: theme.palette.text.primary,
                      margin: '0px 8px 8px 0px',
                      '& .MuiChip-deleteIcon': {
                        color: theme.palette.text.primary,
                      },
                    }}
                  />
                ))}
              </Stack>
            )}

            <Stack
              className="customScrollbar"
              sx={{
                overflowY: 'auto',
                overflowX: 'hidden',
                height: '450px',
                marginRight: '-15px!important',
                paddingRight: '12px',
                paddingBottom: '80px',
              }}
            >
              <FriendList
                searchQuery={searchQuery}
                selectedUsers={selectedUsers}
                onCheck={(user, newSelectedUsers) => {
                  setSelectedUsers(newSelectedUsers);
                }}
              />
            </Stack>

            <Stack spacing={2} direction={'row'} alignItems="center" sx={step === 2 ? sxButtonGroupStep2 : {}}>
              <Button size="large" onClick={onBack} sx={{ flex: 1 }}>
                {t('create_channel.back')}
              </Button>
              <LoadingButton
                size="large"
                type="submit"
                variant="contained"
                loading={isLoading}
                sx={{ flex: 1 }}
                disabled={selectedUsers.length === 0}
              >
                {t('create_channel.create')}
              </LoadingButton>
            </Stack>
          </>
        )}
      </Stack>
    </FormProvider>
  );
};

const CreateChannel = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { openDialogCreateChannel } = useSelector(state => state.dialog);
  const [step, setStep] = useState(1); // 1: Info, 2: Members

  const onStepChange = newStep => setStep(newStep);

  const onCloseDialogCreateChannel = () => {
    setStep(1);
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
    >
      <DialogTitle>{step === 1 ? t('create_channel.title') : t('create_channel.title_addMember') }</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        <CreateGroupForm onCloseDialogCreateChannel={onCloseDialogCreateChannel} step={step} setStep={onStepChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannel;
