'use client';

import React, { useMemo } from 'react';

import { gameConfig } from '~/lib/viem';

import { zeroAddress } from 'viem';
import { useReadContracts } from 'wagmi';
import type { OverlayProps } from '~/types';

import { BettingOverlay } from './betting';
import { EndedOverlay } from './ended';
import { ShowdownOverlay } from './showdown';
import { ShuffleOverlay } from './shuffle';
import { WaitingOverlay } from './waiting';

export const GameOverlay = ({ contractAddress, refresh }: OverlayProps) => {
  const { data, refetch } = useReadContracts({
    query: {
      refetchInterval: 4000, // Poll every 4 seconds for state changes
      gcTime: 0, // Don't cache
      staleTime: 0, // Always fresh
    },
    contracts: [
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_totalPlayers',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_totalShuffles',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_currentRound',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'winner',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_gameStarted',
      },
    ],
  });

  const stage = useMemo(() => {
    let currentStage:
      | 'waiting'
      | 'shuffle'
      | 'started'
      | 'choose-cards'
      | 'ended';

    const totalPlayers = Number((data?.[0]?.result as bigint | undefined) ?? 0n);
    const totalShuffles = Number((data?.[1]?.result as bigint | undefined) ?? 0n);
    const currentRound = Number((data?.[2]?.result as bigint | undefined) ?? 0n); // 5 is end
    const winnerData = data?.[3]?.result as readonly [string, bigint] | undefined;
    const winnerAddr = winnerData?.[0] ?? zeroAddress;
    const hasGameStarted = (data?.[4]?.result as boolean | undefined) ?? false;

    if (totalPlayers === 1 || !hasGameStarted) {
      currentStage = 'waiting';
      return currentStage;
    }

    if (totalShuffles !== totalPlayers) {
      currentStage = 'shuffle';
      return currentStage;
    }

    if (currentRound < 5) {
      currentStage = 'started';
      return currentStage;
    }

    if (winnerAddr === zeroAddress) {
      currentStage = 'choose-cards';
      return currentStage;
    }
    currentStage = 'ended';
    return currentStage;
  }, [data]);

  const refreshData = async () => {
    await refetch();
    // Also trigger parent refresh if provided
    if (refresh) {
      await refresh();
    }
  };

  if (stage === 'waiting') {
    return <WaitingOverlay contractAddress={contractAddress} refresh={refreshData} />;
  }

  if (stage === 'shuffle') {
    return <ShuffleOverlay contractAddress={contractAddress} refresh={refreshData} />;
  }

  if (stage === 'started') {
    return <BettingOverlay contractAddress={contractAddress} refresh={refreshData} />;
  }

  if (stage === 'choose-cards') {
    return <ShowdownOverlay contractAddress={contractAddress} refresh={refreshData} />;
  }

  // stage === 'ended'
  return <EndedOverlay contractAddress={contractAddress} refresh={refreshData} />;
};