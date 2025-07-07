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

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.app);
  const [showPassword, setShowPassword] = useState(false);

  const ResetPasswordSchema = Yup.object().shape({
    token: Yup.string().required('Code is required'),
    password: Yup.string().required('Password is required'),
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
          type={showPassword ? 'text' : 'password'}
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
        Reset password
      </LoadingButton>
    </FormProvider>
  );
};

const ForgotPassword = () => {
  const { isLoading, isResetEmailSent } = useSelector(state => state.app);
  const dispatch = useDispatch();

  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
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
          Forgot your password?
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 5 }}>
          Please enter the email address associated with your account and we will email you a verification code to reset
          your password.
        </Typography>
      </Stack>

      {isResetEmailSent ? (
        <ResetPassword />
      ) : (
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <RHFTextField name="email" label="Email address" />

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
            Send Request
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
        Return to sign in
      </Link>
    </>
  );
};

export default ForgotPassword;
