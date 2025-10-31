import { Stack, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import React, { useState } from 'react';
import { CaretLeft } from 'phosphor-react';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField } from '../../components/hook-form';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { ForgotPasswordByEmail, ResetPasswordByEmail } from '../../redux/slices/auth';
import { Eye, EyeSlash } from 'phosphor-react';
import { setIsResetEmailSent } from '../../redux/slices/app';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isLoading } = useSelector(state => state.app);
  const [showPassword, setShowPassword] = useState(false);

  const ResetPasswordSchema = Yup.object().shape({
    token: Yup.string().required(t('forgot_password.code_required')),
    password: Yup.string().required(t('forgot_password.password_required')),
  });

  const methods = useForm({
    resolver: yupResolver(ResetPasswordSchema),
    defaultValues: { token: '', password: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = async data => {
    try {
      dispatch(ResetPasswordByEmail(data));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFTextField name="token" label="Code" />

        <RHFTextField
          name="password"
          label="New password"
          type={showPassword ? t('forgot_password.text') : t('forgot_password.password')}
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
        loading={isLoading}
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        sx={{
          mt: 3,
          bgcolor: 'text.primary',
          color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          '&:hover': {
            bgcolor: 'text.primary',
            color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
          },
        }}
      >
        {t('forgot_password.reset_password')}
      </LoadingButton>
    </FormProvider>
  );
};

const ForgotPassword = () => {
  const { isLoading, isResetEmailSent } = useSelector(state => state.app);
  const dispatch = useDispatch();

  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().required(t('forgot_password.email_required')).email(t('forgot_password.email_invalid')),
  });

  const methods = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = async data => {
    try {
      dispatch(ForgotPasswordByEmail(data));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
        <Typography variant="h3" paragraph>
          {t('forgot_password.title')}
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 5 }}>
          {t('forgot_password.message')}
        </Typography>
      </Stack>

      {isResetEmailSent ? (
        <ResetPassword />
      ) : (
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <RHFTextField name="email" label={t('forgot_password.email_label')} />

          <LoadingButton
            loading={isLoading}
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            sx={{
              mt: 3,
              bgcolor: 'text.primary',
              color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
              '&:hover': {
                bgcolor: 'text.primary',
                color: theme => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
              },
            }}
          >
            {t('forgot_password.send_request')}
          </LoadingButton>
        </FormProvider>
      )}

      <Link
        component={RouterLink}
        to={'/login'}
        color="inherit"
        variant="subtitle2"
        sx={{
          mt: 3,
          mx: 'auto',
          alignItems: 'center',
          display: 'inline-flex',
        }}
        onClick={() => dispatch(setIsResetEmailSent(false))}
      >
        <CaretLeft size={24} />
        {t('forgot_password.return_sign_in')}
      </Link>
    </>
  );
};

export default ForgotPassword;
