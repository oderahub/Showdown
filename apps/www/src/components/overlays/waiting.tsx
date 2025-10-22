import React from 'react';

import { errorHandler } from '~/lib/utils';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { useReadContract, useWriteContract } from 'wagmi';
import type { OverlayProps } from '~/types';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';

export const WaitingOverlay = ({ contractAddress, refresh }: OverlayProps) => {
  const { data: totalPlayers } = useReadContract({
    ...gameConfig,
    address: contractAddress,
    functionName: '_totalPlayers',
    query: {
      refetchInterval: 3000, // Poll every 3 seconds to detect new players
    },
  });

  const { writeContractAsync } = useWriteContract();

  const onStartGame = async () => {
    const id = toast.loading('Starting game...');
    try {
      // Validate minimum players
      const currentPlayers = Number(totalPlayers ?? 0);
      if (currentPlayers < 2) {
        throw new Error('Need at least 2 players to start the game');
      }

      console.log('[StartGame] Starting game with', currentPlayers, 'players');
      console.log('[StartGame] Contract address:', contractAddress);

      const hash = await writeContractAsync({
        ...gameConfig,
        address: contractAddress,
        functionName: 'startGame',
        gas: 500000n, // Set explicit gas limit to avoid estimation errors
      });

      console.log('[StartGame] Transaction sent:', hash);
      toast.loading('Waiting for confirmation...', { id });

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        timeout: 60_000, // 60 second timeout
      });

      console.log('[StartGame] Transaction confirmed:', receipt);
      toast.success('Game Started Successfully!', { id });

      // Refresh state
      if (refresh) {
        await refresh();
      }
    } catch (error) {
      console.error('[StartGame] Error:', error);

      // Type-safe error details extraction
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        code: (error as Record<string, unknown>).code,
        data: (error as Record<string, unknown>).data,
        cause: (error as Record<string, unknown>).cause,
      };
      console.error('[StartGame] Error details:', errorDetails);

      // Better error messages
      let errorMessage = errorHandler(error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('400')) {
        errorMessage = 'RPC error: Please try again or check if all players have shuffled';
      }

      toast.error(errorMessage, { id });
    }
  };

  return (
    <Overlay>
      <div className='flex w-full flex-col gap-4'>
        <div className='text-center font-poker text-4xl'>Waiting Stage</div>
        <div className='text-center font-poker text-2xl'>
          Total Players: {totalPlayers ?? 0}
        </div>
        <div className='flex w-full items-center justify-center font-poker text-2xl'>
          Waiting for other players...
        </div>
        <Button
          className='mx-auto w-fit font-poker text-xl'
          onClick={onStartGame}
        >
          Start Game
        </Button>
      </div>
    </Overlay>
  );
};
