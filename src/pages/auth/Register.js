import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Stack, Typography, Link, IconButton, InputAdornment, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { Eye, EyeSlash } from 'phosphor-react';
import FormProvider from '../../components/hook-form/FormProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { RHFTextField } from '../../components/hook-form';
import { RegisterUserByEmail } from '../../redux/slices/auth';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function Register() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(state => state.app);
  const [showPassword, setShowPassword] = useState(false);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required(t('register.email_required')).email(t('register.email.valid')),
    password: Yup.string().required(t('register.password_required')),
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
    formState: { errors },
  } = methods;

  const onSubmit = async data => {
    try {
      dispatch(RegisterUserByEmail(data, navigate));
    } catch (error) {
      reset();
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
        <Typography variant="h4">{t('register.title')}</Typography>

        <Stack direction="row" spacing={0.5}>
          <Typography variant="body2"> {t('register.message')} </Typography>

          <Link component={RouterLink} to={'/login'} variant="subtitle2">
            {t('register.sign_in')}
          </Link>
        </Stack>
      </Stack>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3} mb={4}>
          {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
          <RHFTextField name="email" label={t('register.email_label')} />

          <RHFTextField
            name="password"
            label={t('register.password_label')}
            type={showPassword ? t('register.text') : t('register.password_label')}
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
          {t('register.create_account')}
        </LoadingButton>
      </FormProvider>
    </>
  );
}
