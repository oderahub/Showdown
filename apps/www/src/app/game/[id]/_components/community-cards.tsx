import React from 'react';

import { gameConfig, wagmiConfig } from '~/lib/viem';

import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { PokerCard } from '~/components';

interface CommunityCardsProps {
  contractAddress: `0x${string}`;
  cards: number[];
}

export const CommunityCards = ({
  contractAddress,
  cards,
}: CommunityCardsProps) => {
  return (
    <div className='absolute right-1/2 top-1/2 z-[5] mx-auto flex w-fit translate-x-1/2 flex-col gap-2'>
      <div className='flex flex-row items-center gap-3'>
        {cards.map((i) => {
          if (i !== 0) {
            return (
              <CommunityCard
                key={i}
                cardIndex={i}
                contractAddress={contractAddress}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

interface CommunityCardProps {
  contractAddress: `0x${string}`;
  cardIndex: number;
}

const CommunityCard = ({ contractAddress, cardIndex }: CommunityCardProps) => {
  const data = useQuery({
    queryKey: ['community-card', contractAddress, cardIndex],
    initialData: null,
    refetchInterval: 2000,
    queryFn: async () => {
      try {
        const card = await readContract(wagmiConfig, {
          ...gameConfig,
          address: contractAddress,
          functionName: 'revealCard',
          args: [cardIndex],
        });
        return card;
      } catch (error) {
        return null;
      }
    },
  });

  // Show loading state while card is being revealed
  if (data.data === null || data.data === undefined || data.data === -1) {
    return (
      <div className='flex h-28 w-20 items-center justify-center rounded-lg bg-gray-700/50 shadow-lg'>
        <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent' />
      </div>
    );
  }

  return <PokerCard cardId={data.data as number} className='w-20 rounded-lg' />;
};
