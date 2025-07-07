import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Buffer } from 'buffer';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import {
  arbitrum,
  avalanche,
  bsc,
  gnosis,
  mainnet,
  optimism,
  polygon,
  zkSync,
  zora,
  base,
  celo,
  aurora,
} from 'wagmi/chains';
import { DOMAIN_APP } from '../../config';

// window.global = window;
// window.process = process;
const queryClient = new QueryClient();
// if (!window.Buffer) {
//   window.Buffer = Buffer;
// }

const chains = [mainnet, polygon, avalanche, arbitrum, bsc, optimism, gnosis, zkSync, zora, base, celo, aurora];

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || ''; // this is projectId of WalletConnect lib

const metadata = {
  name: 'ErmisChat',
  description: 'The Next-Gen Web3 Communication Infrastructure',
  url: DOMAIN_APP,
  icons: ['https://ermis.network/images/photo_Layer_1.png'],
};

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({ wagmiConfig, projectId, chains });

const WalletWrapper = ({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletWrapper;
