import React, { useEffect } from 'react';

import { errorHandler } from '~/lib/utils';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import type { OverlayProps } from '~/types';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';

export const WaitingOverlay = ({ contractAddress, refresh }: OverlayProps) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: totalPlayers, refetch } = useReadContract({
    ...gameConfig,
    address: contractAddress,
    functionName: '_totalPlayers',
    query: {
      refetchInterval: 3000, // Poll every 3 seconds to detect new players
      gcTime: 0, // Don't cache
      staleTime: 0, // Always consider data stale
      refetchOnWindowFocus: true, // Refetch when window regains focus
    },
  });

  useEffect(() => {
    const onFocus = () => {
      console.log('[WaitingOverlay] Window focused, refetching...');
      void refetch();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  useEffect(() => {
    console.log(
      '[WaitingOverlay] Player count:',
      totalPlayers,
      'Contract:',
      contractAddress,
      'Account:',
      address,
      'Chain:',
      chainId
    );
  }, [totalPlayers, contractAddress, address, chainId]);

  const { writeContractAsync } = useWriteContract();

  const onStartGame = async () => {
    const id = toast.loading('Starting game...');
    try {
      const currentPlayers = Number(totalPlayers ?? 0);
      if (currentPlayers < 2) {
        throw new Error('Need at least 2 players to start the game');
      }

      const hash = await writeContractAsync({
        ...gameConfig,
        address: contractAddress,
        functionName: 'startGame',
        gas: 500000n,
      });

      toast.loading('Waiting for confirmation...', { id });

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        timeout: 60_000,
      });

      console.log('[StartGame] Transaction confirmed:', receipt);
      toast.success('Game Started Successfully!', { id });

      if (refresh) {
        await refresh();
      }
    } catch (error) {
      console.error('[StartGame] Error:', error);

      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as Record<string, unknown>).code,
        data: (error as Record<string, unknown>).data,
        cause: (error as Record<string, unknown>).cause,
      };
      console.error('[StartGame] Error details:', errorDetails);

      let errorMessage = errorHandler(error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('400')) {
        errorMessage =
          'RPC error: Please try again or check if all players have shuffled';
      }

      toast.error(errorMessage, { id });
    }
  };

  const totalPlayersCount = Number(totalPlayers ?? 0);
  const totalPlayersText = totalPlayers?.toString() ?? '0';
  const startButtonLabelSuffix =
    totalPlayersCount >= 2 ? '✓' : `(${String(totalPlayersCount)}/2)`;

  return (
    <Overlay minimizable title='Waiting Stage'>
      <div className='flex w-full flex-col gap-4'>
        <div className='text-center font-poker text-4xl'>Waiting Stage</div>
        <div className='text-center font-poker text-2xl'>
          Total Players: {totalPlayersText}
        </div>
        <div className='text-center text-sm text-neutral-400'>
          Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </div>
        <div className='text-center text-xs text-neutral-500'>
          You: {address?.slice(0, 6)}...{address?.slice(-4)} | Chain: {chainId}
        </div>
        <div className='flex w-full items-center justify-center font-poker text-2xl'>
          {totalPlayersCount < 2
            ? 'Waiting for other players...'
            : 'Ready to start!'}
        </div>
        <Button
          className='mx-auto w-fit'
          variant='secondary'
          onClick={() => void refetch()}
        >
          Refresh Player Count
        </Button>
        <Button
          className='mx-auto w-fit font-poker text-xl'
          disabled={totalPlayersCount < 2}
          onClick={onStartGame}
        >
          Start Game {startButtonLabelSuffix}
        </Button>
      </div>
    </Overlay>
  );
};
