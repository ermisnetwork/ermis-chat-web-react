import React from 'react';
import { Dialog, DialogContent, Slide, Box, Typography, Paper, Stack, Card, CardContent, Button } from '@mui/material';
import Logo from '../../assets/Images/logo.svg';
import LogoSdk from '../../assets/Images/logo-sdk.webp';
import { CHAIN_ID, PlatformType } from '../../constants/wallet-const';
import { useDispatch, useSelector } from 'react-redux';
import { SetChainCurrent } from '../../redux/slices/wallet';
import { LocalStorageKey } from '../../constants/localStorage-const';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DATA = [
  {
    type: PlatformType.Sdk,
    logo: LogoSdk,
    description: 'Chats on platforms integrated through the SDK',
    buttonText: 'Go to SDK',
  },

  {
    type: PlatformType.Ermis,
    logo: Logo,
    description: 'Chats on Ermis App',
    buttonText: 'Go to Ermis',
  },
];

const PlatformDialog = () => {
  const dispatch = useDispatch();
  const { chains } = useSelector(state => state.wallet);

  const onClickPlatform = type => {
    if (type === PlatformType.Sdk) {
      const chain_id = Number(localStorage.getItem(LocalStorageKey.ChainId));
      const chainSdk = chains.find(item => item.chain_id === chain_id);
      dispatch(SetChainCurrent(chainSdk));
    } else {
      const chainErmis = chains.find(item => item.chain_id === CHAIN_ID.Ermis);
      dispatch(SetChainCurrent(chainErmis));
    }
  };

  return (
    <Dialog
      open={true}
      TransitionComponent={Transition}
      keepMounted
      // onClose={onCloseDialog}
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '500px',
          },
        },
      }}
    >
      <DialogContent>
        <Paper elevation={3} sx={{ textAlign: 'center', padding: '24px', marginBottom: '30px' }}>
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px', marginBottom: '5px' }}>
            Select a platform
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '14px' }}>
            Please choose one of the two platforms to proceed.
          </Typography>
        </Paper>

        <Stack direction="row" spacing={2}>
          {DATA.map(item => {
            return (
              <Card key={item.type} variant="outlined" sx={{ flex: 1, textAlign: 'center', height: '230px' }}>
                <CardContent sx={{ height: '100%' }}>
                  <Box
                    sx={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: 'auto',
                    }}
                  >
                    <img src={item.logo} alt="logo" />
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '14px', margin: '15px 0', height: '55px' }}>
                    {item.description}
                  </Typography>
                  <Button variant="contained" onClick={() => onClickPlatform(item.type)}>
                    {item.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformDialog;
