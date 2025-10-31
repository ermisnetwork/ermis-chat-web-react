import React, { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Card, CardContent, CardActions, Typography, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import { LoadingButton } from '@mui/lab';
import { DeleteAccount, DeleteAccountNoAuth, GetChallenge, GetChallengeNoAuth } from '../../redux/slices/wallet';
import { useAccount, useDisconnect, useSignTypedData } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import WalletWrapper from '../../layouts/wallet';
import { useTranslation } from 'react-i18next';

const CardDeleteAccount = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signTypedDataAsync } = useSignTypedData();
  const { connector, address } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  const { isLoading } = useSelector(state => state.app);
  const { isLoggedIn } = useSelector(state => state.auth);
  const { challenge } = useSelector(state => state.wallet);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(GetChallenge());
    } else {
      if (address) {
        dispatch(GetChallengeNoAuth(address.toLowerCase()));
      }
    }
  }, [isLoggedIn, address, dispatch]);

  const onCancel = () => {
    if (isLoggedIn) {
      navigate(`${DEFAULT_PATH}`);
    } else {
      disconnect();
      navigate(`/login`);
    }
  };

  const onOpenModalWallet = () => {
    open();
  };

  const onSign = async () => {
    const { types, domain, primaryType, message } = challenge;
    let signature = '';

    await signTypedDataAsync(
      {
        types,
        domain,
        connector,
        primaryType,
        message,
      },
      {
        onSuccess: s => {
          signature = s;
        },
      },
    );

    return signature;
  };

  const onDelete = async () => {
    const signature = await onSign();

    if (signature) {
      if (isLoggedIn) {
        dispatch(DeleteAccount(signature, t));
      } else {
        dispatch(DeleteAccountNoAuth(signature, address.toLowerCase(), t));
      }
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: '500px' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {t('delete_account.title')}
        </Typography>
        <Divider sx={{ margin: '15px 0' }} />
        <div>
          <p>{t('delete_account.message')}</p>
          <ul style={{ paddingLeft: '15px' }}>
            <li>
              <strong>{t('delete_account.list_message_fisrt-strong')}</strong>{t('delete_account.list_message_fisrt')}
            </li>
            <li>
              <strong>{t('delete_account.list_message_two-strong')}</strong>{t('delete_account.list_message_two')}
            </li>
          </ul>
          <p style={{ marginTop: '15px' }}>{t('delete_account.message_question')}</p>
        </div>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', padding: '8px 24px 24px' }}>
        <Button onClick={onCancel}>{t('delete_account.cancel')}</Button>
        {address ? (
          <LoadingButton color="error" onClick={onDelete} loading={isLoading}>
            {t('delete_account.delete')}
          </LoadingButton>
        ) : (
          <Button variant="contained" sx={{ textTransform: 'none' }} onClick={onOpenModalWallet}>
            {t('delete_account.connect_wallet')}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const DeleteAccountPage = () => {
  return (
    <>
      <WalletWrapper>
        <Stack
          direction="row"
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'baseline',
            padding: '100px 50px',
          }}
        >
          <CardDeleteAccount />
        </Stack>
      </WalletWrapper>
    </>
  );
};

export default DeleteAccountPage;
