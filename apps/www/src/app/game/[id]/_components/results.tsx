import React from 'react';

import { truncate } from '~/lib/utils';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { zeroAddress } from 'viem';
import { PokerCard } from '~/components';

import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog';

import { MedalIcon } from 'lucide-react';

interface ResultsProps {
  contractAddress: `0x${string}`;
  totalPlayers: number;
}

// Define types for contract responses
interface PlayerData {
  addr: string;
  folded: boolean;
  // Add other fields from your Player struct if needed
}

export const Results = ({ contractAddress, totalPlayers }: ResultsProps) => {
  return (
    <div className='absolute bottom-12 left-12'>
      <Dialog>
        <DialogTrigger className='flex flex-row items-center gap-2 rounded-full border-2 border-[#70AF8A] bg-[#204D39] px-4 py-2 text-lg text-[#89d6a9]'>
          <MedalIcon className='text-lg text-[#89d6a9]' />
          Results
        </DialogTrigger>
        <DialogContent className='flex w-full max-w-xl flex-row items-center justify-center !rounded-3xl bg-[#204D39] py-8'>
          <div className='flex flex-col gap-2'>
            {Array.from({ length: totalPlayers }, (_, i) => i).map((i) => {
              return (
                <PlayerCardForPlayer
                  key={i}
                  contractAddress={contractAddress}
                  playerIndex={i}
                />
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PlayerCardProps {
  contractAddress: `0x${string}`;
  playerIndex: number;
}

const PlayerCardForPlayer = ({
  contractAddress,
  playerIndex,
}: PlayerCardProps) => {
  const { data } = useQuery({
    queryKey: ['result-player-card', contractAddress, playerIndex],
    queryFn: async () => {
      try {
        const playerAddr = await readContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: '_players',
          args: [BigInt(playerIndex)],
        });

        // Type assertion for player data
        const playerData = playerAddr as PlayerData;

        const cards = await readContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: 'getPlayerRevealedCards',
          args: [playerData.addr],
        });

        // Type assertion for cards array
        const revealedCards = cards as number[];

        const weight = await readContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: '_weights',
          args: [BigInt(playerIndex)],
        });

        // Type assertion for weight
        const playerWeight = weight as bigint;

        console.log(cards);
        return {
          cards: revealedCards.map((c) => c),
          weight: playerWeight,
          playerAddress: playerData.addr,
        };
      } catch (error) {
        console.log(error);
        return {
          cards: [-1, -1, -1, -1, -1],
          weight: BigInt(0),
          playerAddress: zeroAddress,
        };
      }
    },
  });

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-row justify-between text-base'>
        <div>Player: {truncate(data?.playerAddress ?? zeroAddress, 8)}</div>
        <div>Weight: {(data?.weight ?? BigInt(0)).toLocaleString()}</div>
      </div>
      <div className='item-center flex flex-row gap-2'>
        {(data?.cards ?? []).map((cardId, idx) => (
          <PokerCard key={`${String(cardId)}-${String(idx)}`} cardId={cardId} className='w-24' />
        ))}
      </div>
    </div>
  );
};