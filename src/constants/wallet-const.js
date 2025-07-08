import LogoEth from '../assets/Images/logo-eth.webp';
import LogoPolygon from '../assets/Images/logo-polygon.webp';
import LogoAvalanche from '../assets/Images/logo-avalanche.webp';
import LogoArbitrum from '../assets/Images/logo-arbitrum.webp';
import LogoBnb from '../assets/Images/logo-bnb.webp';
import LogoOp from '../assets/Images/logo-op.webp';
import LogoGnosis from '../assets/Images/logo-gnosis.webp';
import LogoZkSync from '../assets/Images/logo-zksync.webp';
import LogoZora from '../assets/Images/logo-zora.webp';
import LogoBase from '../assets/Images/logo-base.webp';
import LogoCelo from '../assets/Images/logo-celo.webp';
import LogoAurora from '../assets/Images/logo-aurora.webp';
import LogoErmis from '../assets/Images/logo.svg';
import LogoSdk from '../assets/Images/logo-sdk.webp';

export const CHAIN_ID = {
  Ermis: 0,
  Eth: 1,
  Polygon: 137,
  Avalanche: 43114,
  Arbitrum: 42161,
  Bnb: 56,
  Op: 10,
  Gnosis: 100,
  ZkSync: 324,
  Zora: 7777777,
  Base: 8453,
  Celo: 42220,
  Aurora: 1313161554,
};

export const CHAINS = [
  {
    id: CHAIN_ID.Ermis,
    name: 'Ermis',
    logo: LogoErmis,
  },
  {
    id: CHAIN_ID.Eth,
    name: 'Ethereum',
    logo: LogoEth,
  },
  {
    id: CHAIN_ID.Polygon,
    name: 'Polygon',
    logo: LogoPolygon,
  },
  {
    id: CHAIN_ID.Avalanche,
    name: 'Avalanche',
    logo: LogoAvalanche,
  },
  {
    id: CHAIN_ID.Arbitrum,
    name: 'Arbitrum One',
    logo: LogoArbitrum,
  },
  {
    id: CHAIN_ID.Bnb,
    name: 'BNB Smart Chain',
    logo: LogoBnb,
  },
  {
    id: CHAIN_ID.Op,
    name: 'OP Mainnet',
    logo: LogoOp,
  },
  {
    id: CHAIN_ID.Gnosis,
    name: 'Gnosis',
    logo: LogoGnosis,
  },
  {
    id: CHAIN_ID.ZkSync,
    name: 'zkSync Era',
    logo: LogoZkSync,
  },
  {
    id: CHAIN_ID.Zora,
    name: 'Zora',
    logo: LogoZora,
  },
  {
    id: CHAIN_ID.Base,
    name: 'Base',
    logo: LogoBase,
  },
  {
    id: CHAIN_ID.Celo,
    name: 'Celo',
    logo: LogoCelo,
  },
  {
    id: CHAIN_ID.Aurora,
    name: 'Aurora',
    logo: LogoAurora,
  },
];
