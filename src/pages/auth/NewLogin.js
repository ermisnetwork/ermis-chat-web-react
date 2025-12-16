import {
  Box,
  Divider,
  Stack,
  Typography,
  Button,
  InputAdornment,
  FormControlLabel,
  useTheme,
  alpha,
  styled,
} from '@mui/material';
import Iconify from '../../components/Iconify';
import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, Link as RouterLink } from 'react-router-dom';
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import RHFCodes from '../../components/hook-form/RHFCodes';
import { CaretLeft } from 'phosphor-react';
import { API_KEY, BASE_URL } from '../../config';
import { ErmisAuthProvider } from 'ermis-chat-js-sdk';
import { useDispatch, useSelector } from 'react-redux';
import { SetAuthProvider, showSnackbar } from '../../redux/slices/app';
import { GoogleLogin } from '@react-oauth/google';
import { logIn } from '../../redux/slices/auth';
import { LocalStorageKey } from '../../constants/localStorage-const';
import uuidv4 from '../../utils/uuidv4';
import useResponsive from '../../hooks/useResponsive';
import { LoadingSpinner } from '../../components/animate';
import CustomCheckbox from '../../components/CustomCheckbox';
import { useTranslation } from 'react-i18next';
import { SlideLogin1, SlideLogin2, SlideLogin3 } from '../../components/Icons';
import Slider from 'react-slick';
import Logo from '../../assets/Images/uhm.svg';
import SlideMobile1 from '../../assets/Images/slider-mobile1.png';
import SlideMobile2 from '../../assets/Images/slider-mobile2.png';
import SlideMobile3 from '../../assets/Images/slider-mobile3.png';
import DownloadAppStore from '../../assets/Images/download-app-store.png';
import DownloadGooglePlay from '../../assets/Images/download-google-play.png';
import ImageCanvas from '../../components/ImageCanvas';


const StyledSlider = styled(Slider)(({ theme }) => ({
  width: '100%',
  padding: '0px 15px',
  '& .slick-dots': {
    bottom: '0px',
    '& li': {
      width: 'auto',
      height: 'auto',

      '&.slick-active': {
        '& button': {
          width: '17px',
          borderRadius: '16px',
          backgroundColor: theme.palette.primary.main,
        },
      },

      '& button': {
        width: '6px',
        height: '6px',
        backgroundColor: theme.palette.background.neutral,
        borderRadius: '50%',
        transition: 'all 0.3s ease',
      },

      '& button:before': {
        display: 'none',
      },
    },
  },
}));

// ----------------------------------------------------------------------

const LOGIN_METHODS = [
  {
    key: 'email',
    label: 'Email',
    icon: 'solar:letter-linear',
  },
  {
    key: 'phone',
    label: 'Phone',
    icon: 'solar:iphone-linear',
  },
  {
    key: 'google',
    label: 'Google',
    icon: 'proicons:google',
  },
];

export default function NewLogin() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobileToLg = useResponsive('down', 'lg');
  const dispatch = useDispatch();
  const { authProvider } = useSelector(state => state.app);
  const phoneRef = useRef();
  const emailRef = useRef();
  const [loginType, setLoginType] = useState('phone');
  const [loginData, setLoginData] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const isScreenMdToXl = useResponsive('between', null, 'md', 'xl');
  const isMobileToMd = useResponsive('down', 'md');
  const imageSize = isMobileToMd ? 280 : isScreenMdToXl ? 350 : 520;


  useEffect(() => {
    dispatch(SetAuthProvider(new ErmisAuthProvider(API_KEY, { baseURL: BASE_URL })));
  }, []);

  useEffect(() => {
    if (loginType === 'phone' && phoneRef.current) {
      phoneRef.current.focus();
    }
    if (loginType === 'email' && emailRef.current) {
      emailRef.current.focus();
    }
  }, [loginType]);

  useEffect(() => {
    if (showOtp) {
      let timer;
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }
  }, [countdown, showOtp]);

  const phoneSchema = Yup.object().shape({
    phone: Yup.string()
      .required(t('new_login.phone_required'))
      .matches(/^(\+?84|0)?(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-9]|9[0-9])[0-9]{7}$/, t('new_login.phone_invalid')),
  });

  const emailSchema = Yup.object().shape({
    email: Yup.string().required(t('new_login.email_required')).email(t('new_login.email_invalid')),
  });

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(loginType === 'phone' ? phoneSchema : emailSchema),
    defaultValues: {
      phone: '',
      email: '',
    },
  });
  const otpMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      otp1: '',
      otp2: '',
      otp3: '',
      otp4: '',
      otp5: '',
      otp6: '',
    },
  });

  const SLIDE = [
    {
      title: 'index_login.title_one',
      description:
        'index_login.description_one',
      image: <ImageCanvas dataUrl={SlideMobile1} width={'280px'} height={'auto'} styleCustom={{ borderRadius: '6px' }} />,
    },
    {
      title: 'index_login.title_two',
      description:
        'index_login.description_two',
      image: <ImageCanvas dataUrl={SlideMobile2} width={'280px'} height={'auto'} styleCustom={{ borderRadius: '6px' }} />,
    },
    {
      title: 'index_login.title_three',
      description:
        'index_login.description_three',
      image: <ImageCanvas dataUrl={SlideMobile3} width={'280px'} height={'auto'} styleCustom={{ borderRadius: '6px' }} />,
    },
  ];

  const sliderSettings = {
    dots: true,
    fade: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
  };

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async data => {
    try {
      if (loginType === 'phone') {
        let phone = data.phone.trim();
        // Loại bỏ dấu "+" nếu có ở đầu
        if (phone.startsWith('+')) {
          phone = phone.slice(1);
        }
        // Nếu bắt đầu bằng "84" thì giữ nguyên, nếu bắt đầu bằng "0" thì thay bằng "84", nếu không thì thêm "84" vào đầu
        if (phone.startsWith('84')) {
          // giữ nguyên
        } else if (phone.startsWith('0')) {
          phone = '84' + phone.slice(1);
        } else {
          phone = '84' + phone;
        }

        await authProvider.sendOtpToPhone(phone, 'Sms');
        setLoginData({ ...data, phone });
      } else if (loginType === 'email') {
        await authProvider.sendOtpToEmail(data.email);
        setLoginData({ ...data });
      }

      setShowOtp(true);
    } catch (error) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: error.response?.data?.description || t('new_login.otp_send_failed'),
        }),
      );
    }
  };

  const onMethodClick = method => {
    if (method.key === 'google') {
      return;
    }
    setLoginType(method.key);
    methods.reset();
    setAgree(false);
  };

  const onOtpSubmit = async otpData => {
    const otp = Object.values(otpData).join('');
    try {
      const response = await authProvider.verifyOtp(otp);

      if (response) {
        onLoginSuccess(response);
      }
    } catch (error) {
      console.log('OTP verification failed', error.response);
      dispatch(
        showSnackbar({
          severity: 'error',
          message: error.response?.data?.description || t('new_login.otp_verification_failed'),
        }),
      );
    }
  };

  const onBack = () => {
    setShowOtp(false);
    methods.reset();
    otpMethods.reset();
    setLoginData(null);
    setLoginType('phone');
  };

  const onResendOtp = async () => {
    try {
      if (loginType === 'phone') {
        await authProvider.sendOtpToPhone(loginData.phone, 'Sms');
      } else if (loginType === 'email') {
        await authProvider.sendOtpToEmail(loginData.email);
      }
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('new_login.otp_resent_success'),
        }),
      );
      setCountdown(60);
    } catch (error) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: error.response?.data?.description || t('new_login.otp_resend_failed'),
        }),
      );
    }
  };

  const InstallMobileApp = () => {
    return (
      <Stack direction="row" gap={3} sx={{ height: '100%', width: '100%' }}>
        {/* ---------------------lEFT--------------------- */}
        <Stack sx={{ width: '100%', height: '100%', justifyContent: 'start' }}>
          <StyledSlider {...sliderSettings}>
            {SLIDE.map((slide, idx) => (
              <Box key={idx} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                {slide.image}
                <Typography variant="h3" sx={{ marginBottom: '5px' }}>
                  {t(slide.title)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '14px', fontWeight: 400, margin: '0 auto 30px' }}
                >
                  {t(slide.description).split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
              </Box>
            ))}
          </StyledSlider>
          <Box gap={2} sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', mt: 5 }}>
              <Link component={RouterLink} to="https://apps.apple.com/vn/app/uhm-chat-video/id6747392894?l=vi" variant="body2" color="inherit" underline="always">
                <ImageCanvas
                  dataUrl={DownloadAppStore}
                  width={'100%'}
                  height={'auto'}
                  styleCustom={{ borderRadius: '6px' }}
                />
              </Link>
              <Link component={RouterLink} to="https://play.google.com/store/apps/details?id=network.ermis.uhm" variant="body2" color="inherit" underline="always">
                <ImageCanvas
                  dataUrl={DownloadGooglePlay}
                  width={'100%'}
                  height={'auto'}
                  styleCustom={{ borderRadius: '6px' }}
                />
              </Link>
          </Box>
        </Stack>
        {/* ---------------------RIGHT--------------------- */}
      </Stack>
    )
  };

  const onLoginSuccess = data => {
    const { project_id, refresh_token, token, user_id } = data;
    dispatch(
      logIn({
        isLoggedIn: true,
        user_id: user_id,
        chat_project_id: project_id,
        openDialogPlatform: false,
        loginType: loginType,
      }),
    );
    window.localStorage.setItem(LocalStorageKey.UserId, user_id);
    window.localStorage.setItem(LocalStorageKey.AccessToken, token);
    window.localStorage.setItem(LocalStorageKey.RefreshToken, refresh_token);
    window.localStorage.setItem(LocalStorageKey.SessionId, uuidv4());
    window.location.reload();
  };

  const renderLoginForm = () => {
    if (showOtp) {
      return (
        <>
          <Box>
            <Typography variant="h5" sx={{ marginBottom: '5px' }}>
              <CaretLeft size={20} style={{ marginRight: '15px', cursor: 'pointer' }} onClick={onBack} />
              {t('new_login.title')}
            </Typography>
            <Typography variant="body1">
              {t('new_login.verification_one_time_code')}{' '}
              <strong>{loginType === 'phone' ? loginData?.phone : loginData?.email}</strong>
            </Typography>
          </Box>

          <FormProvider methods={otpMethods} onSubmit={otpMethods.handleSubmit(onOtpSubmit)}>
            <RHFCodes keyName="otp" inputs={['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6']} />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={Object.values(otpMethods.watch()).some(v => !v || v.length !== 1)}
            >
              {t('new_login.verify_otp')}
            </Button>
          </FormProvider>
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: '0px!important' }}>
            {countdown > 0 ? (
              <Typography sx={{ fontWeight: 400, padding: '5px', mt: '10px', color: 'primary.main' }}>
                {countdown}s
              </Typography>
            ) : (
              <Button
                variant="text"
                color="primary"
                onClick={onResendOtp}
                sx={{ fontWeight: 400, padding: '5px', mt: '10px' }}
              >
                {t('new_login.send_again')}
              </Button>
            )}
          </Stack>
        </>
      );
    } else {
      if (loginType === 'phone') {
        return (
          <>
            <Typography variant="h5">{t('new_login.enter_phone')}</Typography>

            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
              <RHFTextField
                name="phone"
                placeholder={t('new_login.phone_placeholder')}
                inputRef={phoneRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <img
                        src="https://flagcdn.com/w20/vn.png"
                        alt="VN"
                        style={{ width: 24, marginRight: 2, borderRadius: 3 }}
                      />
                      <Typography sx={{ ml: 0.5, mr: 1, fontWeight: 500 }}>+84</Typography>
                    </InputAdornment>
                  ),
                  type: 'tel',
                }}
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <FormControlLabel
                control={<CustomCheckbox checked={agree} onChange={e => setAgree(e.target.checked)} color="primary" />}
                label={
                  <span>
                    {t('new_login.message_up')}{' '}
                    <Link component={RouterLink} to="https://ermis.network/terms-of-use" target="_blank">
                      {t('new_login.message_down')}
                    </Link>
                    ,{' '}
                    <Link component={RouterLink} to="https://ermis.network/privacy" target="_blank">
                      {t('new_login.message_policy')}
                    </Link>
                  </span>
                }
                sx={{ mt: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                disabled={!agree || !methods.watch('phone')}
              >
                {t('new_login.sign_in')}
              </Button>
            </FormProvider>
          </>
        );
      }
      if (loginType === 'email') {
        return (
          <>
            <Typography variant="h5">{t('new_login.enter_email')}</Typography>
            <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
              <RHFTextField
                name="email"
                placeholder="Email"
                type="email"
                inputRef={emailRef}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:letter-linear" width={24} height={24} />
                    </InputAdornment>
                  ),
                }}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <FormControlLabel
                control={<CustomCheckbox checked={agree} onChange={e => setAgree(e.target.checked)} color="primary" />}
                label={
                  <span>
                    {t('new_login.message_up')}{' '}
                    <Link component={RouterLink} to="https://ermis.network/terms-of-use" target="_blank">
                      {t('new_login.message_down')}
                    </Link>
                    ,{' '}
                    <Link component={RouterLink} to="https://ermis.network/privacy" target="_blank">
                      {t('new_login.message_policy')}
                    </Link>
                  </span>
                }
                sx={{ mt: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                disabled={!agree || !methods.watch('email')}
              >
                {t('new_login.sign_in')}
              </Button>
            </FormProvider>
          </>
        );
      }
    }
    return null;
  };
  

  const otherMethods = LOGIN_METHODS.filter(method => method.key !== loginType);

  return (
    isMobileToMd ? 
      <>
        {InstallMobileApp()}
      </>
    : 
    <Stack
      spacing={4}
      sx={{
        backgroundColor: 'background.default',
        padding: '20px',
        borderRadius: '30px',
        width: isMobileToLg ? '100%' : '500px',
        margin: '0px auto',
        boxShadow: theme.shadows[18],
        position: 'relative',
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            borderRadius: '30px',
          }}
        >
          <LoadingSpinner />
        </Box>
      )}

      <Stack spacing={2}>{renderLoginForm()}</Stack>

      {!showOtp && (
        <>
          <Divider
            sx={{
              '&::before, ::after': {
                border: 'none',
              },
            }}
          >
            {t('new_login.or_sign_in')}
          </Divider>

          <Stack direction="row" spacing={2} justifyContent="center">
            {otherMethods.map(method => {
              if (method.key === 'google') {
                return (
                  <Box key={method.key} sx={{ position: 'relative', cursor: 'pointer' }}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      sx={{ minWidth: 80, width: 80, height: 80, display: 'block' }}
                    >
                      <Iconify icon={method.icon} width={32} height={32} sx={{ margin: 'auto' }} />
                      <span style={{ display: 'block', width: '100%' }}>{method.label}</span>
                    </Button>
                    <GoogleLogin
                      onSuccess={async credentialResponse => {
                        setIsLoading(true);
                        const response = await authProvider.loginWithGoogle(credentialResponse.credential);
                        if (response) {
                          onLoginSuccess(response);
                          setIsLoading(false);
                        }
                      }}
                      onError={() => {
                        dispatch(
                          showSnackbar({
                            severity: 'error',
                            message: t('new_login.snackbar_google_login_failed'),
                          }),
                        );
                        setIsLoading(false);
                      }}
                      containerProps={{ className: 'googleLoginBtn' }}
                    />
                  </Box>
                );
              }

              return (
                <Button
                  key={method.key}
                  variant="outlined"
                  color="inherit"
                  sx={{ minWidth: 80, width: 80, height: 80, display: 'block' }}
                  onClick={() => onMethodClick(method)}
                >
                  <Iconify icon={method.icon} width={32} height={32} sx={{ margin: 'auto' }} />
                  <span style={{ display: 'block', width: '100%' }}>{method.label}</span>
                </Button>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}
