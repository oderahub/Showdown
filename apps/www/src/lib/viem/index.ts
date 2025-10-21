import AddressConfig from 'public/config.json';
import { liskSepolia } from 'viem/chains';
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
      retryCount: 3,
      timeout: 30_000,
    }),
  },
  batch: {
    multicall: false, // Disable global multicall batching
  },
  // Force all queries to use 'latest' block
  cacheTime: 0,
});

export const gameFactoryConfig = {
  abi: GAME_FACTORY_ABI,
  address: AddressConfig.GAME_FACTORY_ADDRESS as `0x${string}`,
} as const;

export const gameConfig = {
  abi: GAME_ABI,
} as const;
