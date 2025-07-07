import React from 'react';
import { Container, Stack } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';

import Logo from '../../assets/Images/uhm.svg';
import { useSelector } from 'react-redux';
import { DEFAULT_PATH } from '../../config';

const AuthLayout = () => {
  const { isLoggedIn } = useSelector(state => state.auth);

  if (isLoggedIn) {
    return <Navigate to={DEFAULT_PATH} />;
  }

  return (
    <>
      <Container sx={{ mt: 5, mb: 5 }} maxWidth="sm">
        <Stack spacing={5}>
          <Stack sx={{ width: '100%' }} direction="column" alignItems={'center'}>
            <img style={{ height: 120, width: 120 }} src={Logo} alt="Logo" />
          </Stack>
          <Outlet />
        </Stack>
      </Container>
    </>
  );
};

export default AuthLayout;
