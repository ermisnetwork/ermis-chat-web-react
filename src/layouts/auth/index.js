import React from 'react';
import { Box, Stack, styled, Typography, useTheme } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';

import Logo from '../../assets/Images/uhm.svg';
import { useSelector } from 'react-redux';
import { DEFAULT_PATH } from '../../config';
import useResponsive from '../../hooks/useResponsive';
import { SlideLogin1, SlideLogin2, SlideLogin3 } from '../../components/Icons';
import Slider from 'react-slick';

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

const AuthLayout = () => {
  const theme = useTheme();
  const { isLoggedIn } = useSelector(state => state.auth);
  const isScreenMdToXl = useResponsive('between', null, 'md', 'xl');
  const isMobileToMd = useResponsive('down', 'md');
  const imageSize = isMobileToMd ? 200 : isScreenMdToXl ? 350 : 520;

  if (isLoggedIn) {
    return <Navigate to={DEFAULT_PATH} />;
  }

  const SLIDE = [
    {
      title: 'Welcome to Uhmm...!',
      description:
        'Uhmm... isn’t just a chat app — it’s a decentralized hub for secure, real-time team collaboration. \nBuilt for Web3, made for you.',
      image: <SlideLogin1 style={{ margin: 'auto' }} size={imageSize} />,
    },
    {
      title: 'Smart. Secure. On-Chain.',
      description:
        'Powered by blockchain, your messages stay encrypted, verified,\nand tamper-proof - with data ownership in your hands.',
      image: <SlideLogin2 style={{ margin: 'auto' }} size={imageSize} />,
    },
    {
      title: 'Ready for the Workforce',
      description:
        'Designed for DAOs, startups, and global teams embracing decentralization.\nUhmm... is your all-in-one, future-proof communication layer.',
      image: <SlideLogin3 style={{ margin: 'auto' }} size={imageSize} />,
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
    autoplaySpeed: 3000,
  };

  return (
    <Stack direction="row" gap={3} sx={{ height: '100%', width: '100%' }}>
      {/* ---------------------lEFT--------------------- */}
      {!isMobileToMd && (
        <Stack sx={{ width: '50%', height: '100%', justifyContent: 'center' }}>
          <StyledSlider {...sliderSettings}>
            {SLIDE.map((slide, idx) => (
              <Box key={idx} sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <Typography variant="h2" sx={{ marginBottom: '5px' }}>
                  {slide.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '18px', fontWeight: 400, margin: '0 auto 30px' }}
                >
                  {slide.description.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
                {slide.image}
              </Box>
            ))}
          </StyledSlider>
        </Stack>
      )}
      {/* ---------------------RIGHT--------------------- */}
      <Stack
        sx={{
          width: isMobileToMd ? '100%' : '50%',
          backgroundColor: theme.palette.grey[100],
          padding: '60px 15px 15px',
        }}
        alignItems="center"
      >
        {/* ---------------------LOGO--------------------- */}
        <Stack sx={{ width: '100%', marginBottom: '50px' }} direction="column" alignItems={'center'}>
          <img style={{ height: 70, width: 230 }} src={Logo} alt="Logo" />
        </Stack>
        <Outlet />
      </Stack>
    </Stack>
  );
};

export default AuthLayout;
