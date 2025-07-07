import { Divider, Stack, Typography } from '@mui/material';
import CustomApiUrlForm from './CustomApiUrlForm';
import { Link, Link as RouterLink } from 'react-router-dom';
import LoginWallet from './LoginWallet';
import LoginEmail from './LoginEmail';
import { isStagingDomain } from '../../utils/commons';
import WalletWrapper from '../../layouts/wallet';
import { useState } from 'react';
import NewLogin from './NewLogin';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../../config';

// ----------------------------------------------------------------------

export default function LoginPage() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  return (
    <>
      <WalletWrapper>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <NewLogin />
        </GoogleOAuthProvider>

        {/* <Stack spacing={2} sx={{ mb: 5, position: 'relative' }}>
          <Typography variant="h4">Login to Ermis</Typography>

          <Stack direction="row" spacing={0.5}>
            <Typography variant="body2" sx={{ fontSize: '14px' }}>
              New user?
            </Typography>
            <Link to={'/register'} component={RouterLink} variant="subtitle2" style={{ fontSize: '14px' }}>
              Create an account
            </Link>
          </Stack>
        </Stack>
        {!isWalletConnected && (
          <>
            <LoginEmail />
            <Divider
              sx={{
                marginTop: '20px',
                typography: 'overline',
                color: 'text.disabled',
                '&::before, ::after': {
                  borderTopStyle: 'dashed',
                },
              }}
            >
              OR
            </Divider>
          </>
        )}

        <LoginWallet setIsWalletConnected={setIsWalletConnected} />
        {isStagingDomain() && <CustomApiUrlForm />} */}
      </WalletWrapper>
    </>
  );
}
