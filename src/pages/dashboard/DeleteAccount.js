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

const CardDeleteAccount = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
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
        dispatch(DeleteAccount(signature));
      } else {
        dispatch(DeleteAccountNoAuth(signature, address.toLowerCase()));
      }
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: '500px' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Account Deletion Confirmation
        </Typography>
        <Divider sx={{ margin: '15px 0' }} />
        <div>
          <p>Deleting your account will result in:</p>
          <ul style={{ paddingLeft: '15px' }}>
            <li>
              <strong>Loss of all data</strong>: All personal information, chat history, and contacts on the Ermis
              platform will be permanently deleted and cannot be recovered.
            </li>
            <li>
              <strong>No impact on SDK-integrated conversations</strong>: Any conversations integrated through the SDK
              will remain unaffected.
            </li>
          </ul>
          <p style={{ marginTop: '15px' }}>Are you sure you want to continue?</p>
        </div>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', padding: '8px 24px 24px' }}>
        <Button onClick={onCancel}>Cancel</Button>
        {address ? (
          <LoadingButton color="error" onClick={onDelete} loading={isLoading}>
            Delete
          </LoadingButton>
        ) : (
          <Button variant="contained" sx={{ textTransform: 'none' }} onClick={onOpenModalWallet}>
            Connect wallet
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
