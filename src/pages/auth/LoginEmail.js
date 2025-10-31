import { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, Stack, IconButton, InputAdornment } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { Eye, EyeSlash } from 'phosphor-react';
import { LoginUserByEmail } from '../../redux/slices/auth';
import { useDispatch, useSelector } from 'react-redux';
import { SetUserLogin, showSnackbar } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function LoginEmail() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, user } = useSelector(state => state.app);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required(t('login_email.email_required')).email(t('login_email.email_invalid')),
    password: Yup.string().required(t('login_email.password_required')),
  });

  const defaultValues = {
    email: '',
    password: '',
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

  useEffect(() => {
    if (user) {
      setValue('email', user.email);
      setValue('password', user.password);

      dispatch(
        showSnackbar({
          severity: 'success',
          message: user.message,
        }),
      );
    }

    return () => {
      dispatch(SetUserLogin(null));
    };
  }, [user, setValue]);

  const onSubmit = async data => {
    try {
      dispatch(LoginUserByEmail(data));
    } catch (error) {
      reset();
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFTextField name="email" label={t('login_email.email_label')} />

        <RHFTextField
          name="password"
          label="Password"
          type={showPassword ? t('login_email.text') : t('login_email.password_label')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <Eye /> : <EyeSlash />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack alignItems="flex-end" sx={{ my: 2 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2" color="inherit" underline="always">
          {t('login_email.title')}
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isLoading}
        sx={{
          bgcolor: 'text.primary',
          color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          '&:hover': {
            bgcolor: 'text.primary',
            color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          },
        }}
      >
        {t('login_email.login')}
      </LoadingButton>
    </FormProvider>
  );
}
