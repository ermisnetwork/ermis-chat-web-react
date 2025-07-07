import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { logIn } from '../../redux/slices/auth';
import { useDispatch } from 'react-redux';
import uuidv4 from '../../utils/uuidv4';
import { ERMIS_PROJECT_ID } from '../../config';
import { LoginType } from '../../constants/commons-const';
import { LocalStorageKey } from '../../constants/localStorage-const';

// ----------------------------------------------------------------------

export default function LoginTokenPage() {
  const dispatch = useDispatch();

  const LoginSchema = Yup.object().shape({
    user_id: Yup.string().required('User ID is required'),
    token: Yup.string().required('Token is required'),
  });

  const defaultValues = {
    user_id: '',
    token: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;

  const onSubmit = async data => {
    const { user_id, token } = data;
    dispatch(
      logIn({
        isLoggedIn: true,
        user_id: user_id,
        project_id_ermis: ERMIS_PROJECT_ID,
        openDialogPlatform: false,
        loginType: LoginType.Email,
      }),
    );
    window.localStorage.setItem(LocalStorageKey.UserId, user_id);
    window.localStorage.setItem(LocalStorageKey.AccessToken, token);
    window.localStorage.setItem(LocalStorageKey.RefreshToken, 'refresh_token');
    window.localStorage.setItem(LocalStorageKey.SessionId, uuidv4());
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFTextField name="user_id" label="User ID" />
        <RHFTextField name="token" label="Token" />
        <LoadingButton
          fullWidth
          color="inherit"
          size="large"
          type="submit"
          variant="contained"
          sx={{
            bgcolor: 'text.primary',
            color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
            '&:hover': {
              bgcolor: 'text.primary',
              color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
            },
          }}
        >
          Login
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
}
