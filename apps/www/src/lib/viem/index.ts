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
import {
  activeChain,
  activeContracts,
  avalancheFuji,
  liskSepolia,
  RPC_URLS,
} from './chains';

export const projectId = env.NEXT_PUBLIC_WALLETCONNECT_ID;

const metadata = {
  name: 'Showdown',
  description: 'Texas Hold\'em with zero-knowledge shuffle verification',
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

// Batching is disabled for Lisk Sepolia RPC compatibility; the generous retry
// and timeout settings suit both testnet RPCs.
const transportOptions = {
  batch: false as const,
  retryCount: 5,
  retryDelay: 1000,
  timeout: 60_000,
  fetchOptions: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

export const wagmiConfig: Config = createConfig({
  chains: [liskSepolia, avalancheFuji],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: getConnectors(),
  transports: {
    [liskSepolia.id]: http(RPC_URLS[liskSepolia.id], transportOptions),
    [avalancheFuji.id]: http(RPC_URLS[avalancheFuji.id], transportOptions),
  },
  batch: {
    multicall: false, // Disable global multicall batching
  },
  // Force all queries to use 'latest' block
  cacheTime: 0,
});

export const gameFactoryConfig = {
  abi: GAME_FACTORY_ABI as Abi,
  address: activeContracts.GAME_FACTORY,
};

export const gameConfig = {
  abi: GAME_ABI as Abi,
  chainId: activeChain.id,
};

export const revealVerifierAddress = activeContracts.REVEAL_VERIFIER;