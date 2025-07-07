import WalletWrapper from '../../layouts/wallet';
import NewLogin from './NewLogin';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../../config';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <WalletWrapper>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <NewLogin />
        </GoogleOAuthProvider>
      </WalletWrapper>
    </>
  );
}
