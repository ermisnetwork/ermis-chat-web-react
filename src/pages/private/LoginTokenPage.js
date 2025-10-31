import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { logIn } from '../../redux/slices/auth';
import { useDispatch } from 'react-redux';
import uuidv4 from '../../utils/uuidv4';
import { CHAT_PROJECT_ID } from '../../config';
import { LoginType } from '../../constants/commons-const';
import { LocalStorageKey } from '../../constants/localStorage-const';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function LoginTokenPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const LoginSchema = Yup.object().shape({
    user_id: Yup.string().required(t('login_token.user_required')),
    token: Yup.string().required(t('login_token.token_required')),
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
        chat_project_id: CHAT_PROJECT_ID,
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
        <RHFTextField name="user_id" label={t('login_token.user_id')} />
        <RHFTextField name="token" label={t('login_token.token')} />
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
          {t('login_token.login')}
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
}
