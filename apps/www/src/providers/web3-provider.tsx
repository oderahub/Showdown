'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { projectId, wagmiConfig } from '~/lib/viem';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { type State, WagmiProvider } from 'wagmi';

// Only create Web3Modal on the client side
let modalCreated = false;

const queryClient = new QueryClient();

interface Web3ProviderProps extends PropsWithChildren {
  initialState?: State;
}

export const Web3Provider = ({ children, initialState }: Web3ProviderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Create Web3Modal only once on client side
    if (!modalCreated && typeof window !== 'undefined') {
      createWeb3Modal({
        wagmiConfig,
        projectId,
        enableAnalytics: true,
        enableOnramp: true,
        themeMode: 'dark',
      });
      modalCreated = true;
    }
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};