'use client';

import React, { useMemo } from 'react';

import { firstShuffle, getMaskedCads, shuffle } from '~/lib/shuffle';
import { errorHandler, getErrorAction } from '~/lib/utils';
import { gameConfig, wagmiConfig } from '~/lib/viem';
import { getDeck, getGameKey } from '~/lib/viem/actions';

import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
} from '@wagmi/core';
import { toast } from 'sonner';
import { hexToBigInt, zeroAddress, type Hex } from 'viem';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import type { OverlayProps } from '~/types';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';

import { RefreshCcw } from 'lucide-react';

export const ShuffleOverlay = ({ contractAddress, refresh }: OverlayProps) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data, refetch } = useReadContracts({
    query: {
      refetchInterval: 4000, // Poll to detect other players shuffling
      gcTime: 0, // No caching
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
        functionName: '_shuffled',
        args: [address ?? zeroAddress],
      },
    ],
  });

  const { didPlayerShuffle, playersShuffled, totalPlayers } = useMemo(() => {
    const totalPlayers = Number((data?.[0]?.result as bigint | undefined) ?? 1n);
    const totalShuffles = Number((data?.[1]?.result as bigint | undefined) ?? 0n);
    const shuffled = (data?.[2]?.result as boolean | undefined) ?? false;

    const didAllShuffle = totalShuffles === totalPlayers;

    return {
      didAllShuffle,
      didPlayerShuffle: shuffled,
      playersShuffled: totalShuffles,
      totalPlayers,
    };
  }, [data]);

  const onShuffle = async () => {
    const id = toast.loading('Shuffling Cards...');
    try {
      const gameKey = await getGameKey(contractAddress);
      const totalShufflesRaw = await readContract(wagmiConfig, {
        ...gameConfig,
        address: contractAddress,
        functionName: '_totalShuffles',
      });

      // Type assertion for total shuffles
      const totalShufflesCount = Number((totalShufflesRaw as bigint | undefined) ?? 0n);

      if (totalShufflesCount === 0) {
        console.log('Start get masked cards.');
        const { maskedCards, pkc: _pkc } = await getMaskedCads(gameKey);
        console.log('Done get masked cards.');
        console.log('Start First Shuffle');
        const res = await firstShuffle(gameKey, maskedCards);
        console.log('Done First Shuffle');
        const pkc = _pkc.map((p) => hexToBigInt(p, { size: 32 }));
        const newDeck = res.newDeck.map((o) =>
          o.map((i) => hexToBigInt(i, { size: 32 }))
        );

        const simulated = await simulateContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: 'initShuffle',
          args: [pkc, newDeck],
        });
        const hash = await writeContractAsync(simulated.request);
        await waitForTransactionReceipt(wagmiConfig, { hash });
      } else {
        const oldDeck = await getDeck(contractAddress);

        const res = await shuffle(oldDeck as [Hex, Hex, Hex, Hex][], gameKey);
        console.log(res);
        const newDeck = res.shuffled.cards.map((o) =>
          o.map((i) => hexToBigInt(i))
        );
        const simulated = await simulateContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: 'shuffle',
          args: [newDeck],
        });
        const hash = await writeContractAsync(simulated.request);
        await waitForTransactionReceipt(wagmiConfig, { hash });
      }

      if (refresh) {
        await refresh();
      }
      toast.success('Cards Shuffled Successfully!', { id });
    } catch (error) {
      console.log(error);
      const errorMessage = errorHandler(error);
      const suggestion = getErrorAction(errorMessage);

      toast.error(errorMessage, {
        id,
        description: suggestion ?? undefined,
        duration: 5000,
      });
    }
  };

  return (
    <Overlay minimizable title='Shuffle Stage'>
      <div className='w-full'>
        <div className='flex flex-row items-center justify-center gap-2 text-center font-poker text-4xl'>
          Shuffle Stage
          <Button
            className='h-10 w-10 !p-0 font-sans'
            variant='link'
            onClick={async () => await refetch()}
          >
            <RefreshCcw size={24} />
          </Button>
        </div>
        <div className='py-5 text-center font-poker text-5xl'>
          {playersShuffled} / {totalPlayers}
        </div>
        <div className='flex w-full items-center justify-center font-poker text-3xl'>
          {!didPlayerShuffle ? (
            <Button className='font-sans' onClick={onShuffle}>
              Shuffle Cards
            </Button>
          ) : (
            <>Waiting for other players...</>
          )}
        </div>
      </div>
    </Overlay>
  );
};
