import { liskSepolia } from 'viem/chains';
import type { Abi } from 'viem';
import {
  type Config,
  cookieStorage,
  createConfig,
  createStorage,
  http,
} from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { env } from '~/env';

import { GAME_ABI, GAME_FACTORY_ABI } from './abi';

export const projectId = env.NEXT_PUBLIC_WALLETCONNECT_ID;

// Contract addresses - deployed on Lisk Sepolia
const AddressConfig = {
  GAME_FACTORY_ADDRESS: '0xe86553AE8f33924b5B7174F64ceaCbeff473548D',
  REVEAL_VERIFIER: '0x49cFFa95ffB77d398222393E3f0C4bFb5D996321',
  SHUFFLE_VERIFIER: '0x9193c64f6D57eC9AC22d43c51389d970828D1b10',
};

const metadata = {
  name: 'Texas Hold\'em ZK Poker',
  description: 'Play poker with zero-knowledge shuffles on Lisk Sepolia',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Only initialize WalletConnect on client side to avoid SSR indexedDB errors
const getConnectors = () => {
  const connectors = [];

  // Always available: injected wallet (MetaMask, etc.)
  connectors.push(injected({ shimDisconnect: true }));

  // Only add WalletConnect on client side
  if (typeof window !== 'undefined') {
    connectors.push(walletConnect({ projectId, metadata, showQrModal: false }));
  }

  return connectors;
};

export const wagmiConfig: Config = createConfig({
  chains: [liskSepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: getConnectors(),
  transports: {
    [liskSepolia.id]: http('https://rpc.sepolia-api.lisk.com', {
      batch: false, // Disable all batching for Lisk Sepolia compatibility
      retryCount: 5,
      retryDelay: 1000,
      timeout: 60_000, // Increase timeout to 60s
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
  },
  batch: {
    multicall: false, // Disable global multicall batching
  },
  // Force all queries to use 'latest' block
  cacheTime: 0,
});

export const gameFactoryConfig = {
  abi: GAME_FACTORY_ABI as Abi,
  address: AddressConfig.GAME_FACTORY_ADDRESS as `0x${string}`,
};

export const gameConfig = {
  abi: GAME_ABI as Abi,
  chainId: liskSepolia.id,
};