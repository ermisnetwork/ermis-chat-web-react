import { Stack, Typography } from '@mui/material';
import LoginWallet from '../auth/LoginWallet';
import CustomApiUrlForm from '../auth/CustomApiUrlForm';
import WalletWrapper from '../../layouts/wallet';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SetAuthProvider } from '../../redux/slices/app';
import { ErmisAuthProvider } from 'ermis-chat-js-sdk';
import { API_KEY, BASE_URL } from '../../config';

// ----------------------------------------------------------------------

export default function LoginWalletPage() {
  const dispatch = useDispatch();

  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    dispatch(SetAuthProvider(new ErmisAuthProvider(API_KEY, { baseURL: BASE_URL })));
  }, []);

  return (
    <>
      <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
        <Typography variant="h4">Login to Ermis</Typography>
      </Stack>

      <WalletWrapper>
        <LoginWallet setIsWalletConnected={setIsWalletConnected} />
      </WalletWrapper>

      {/* <CustomApiUrlForm /> */}
    </>
  );
}
