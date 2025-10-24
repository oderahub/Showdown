'use client';

import React, { useMemo } from 'react';

import { getCurrentRound } from '~/lib/helpers';
import { truncate } from '~/lib/utils';
import { gameConfig } from '~/lib/viem';

import MotionNumber from 'motion-number';
import { isAddress, toHex, zeroAddress, type Hex } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { GameOverlay } from '~/components/overlays';
import { Button } from '~/components/ui/button';

import {
  AddPendingCards,
  GameStatistics,
  PlaceBet,
  PlayerCards,
  Results,
} from './_components';
import { ChooseCards } from './_components/choose-cards';
import { CommunityCards } from './_components/community-cards';
import { DeclareResult } from './_components/declare-result';

import { RefreshCcw } from 'lucide-react';

// Define types for contract responses
interface PlayerData {
  addr: string;
  folded: boolean;
}

const GamePage = ({ params }: { params: { id: `0x${string}` } }) => {
  const contractAddress = isAddress(params.id) ? params.id : zeroAddress;

  const { address } = useAccount();

  const { data: res, refetch } = useReadContracts({
    query: {
      refetchInterval: 4000, // Auto-refresh every 4 seconds
      gcTime: 0, // No caching
      staleTime: 0, // Always fresh
    },
    contracts: [
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_currentRound',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getPotAmount',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_highestBet',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'winner',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'nextPlayer',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: '_totalPlayers',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'winner',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getCommunityCards',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getPlayerCards',
        args: [address ?? zeroAddress],
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getDeck',
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getPendingPlayerRevealTokens',
        args: [address ?? zeroAddress],
      },
      {
        ...gameConfig,
        address: contractAddress,
        functionName: 'getPendingCommunityRevealTokens',
        args: [address ?? zeroAddress],
      },
    ],
  });

  const data = useMemo(() => {
    const currentRound = getCurrentRound(Number((res?.[0]?.result as bigint | undefined) ?? 0n));
    const potAmount = Number((res?.[1]?.result as bigint | undefined) ?? 0n);
    const highestBet = Number((res?.[2]?.result as bigint | undefined) ?? 0n);
    const winnerData = res?.[3]?.result as readonly [string, bigint] | undefined;
    const winnerAddress = (winnerData?.[0] ?? zeroAddress) as `0x${string}`;
    const nextPlayerData = res?.[4]?.result as PlayerData | undefined;
    const nextTurn =
      nextPlayerData?.addr === address
        ? 'Me'
        : truncate(nextPlayerData?.addr ?? '', 8);
    const playerCount = Number((res?.[5]?.result as bigint | undefined) ?? 0n);
    const gameEndedData = res?.[6]?.result as readonly [string, bigint] | undefined;
    const gameEnded = gameEndedData?.[0] !== zeroAddress;
    const communityCardsRaw = (res?.[7]?.result as number[] | undefined) ?? [];
    const communityCards = communityCardsRaw.map((c) => c);
    const playerCardsRaw = (res?.[8]?.result as number[] | undefined) ?? [];
    const playerCards = playerCardsRaw.map((c) => c);
    const deckRaw = (res?.[9]?.result as bigint[][] | undefined) ?? [];
    const deck: Hex[][] = deckRaw.map((c) => c.map((i) => toHex(i, { size: 32 })));
    const pendingPlayerCardsRaw = (res?.[10]?.result as number[] | undefined) ?? [];
    const pendingPlayerCards = pendingPlayerCardsRaw
      .filter((c) => c !== 0)
      .map((c) => c);

    const pendingCommunityCardsRaw = (res?.[11]?.result as number[] | undefined) ?? [];
    const pendingCommunityCards = pendingCommunityCardsRaw
      .filter((c) => c !== 0)
      .map((c) => c);

    const pendingCards = [...pendingCommunityCards, ...pendingPlayerCards];
    const isPendingToAddTokens = pendingCards.length > 0;

    return {
      currentRound,
      potAmount,
      highestBet,
      winnerAddress,
      nextTurn,
      playerCount,
      gameEnded,
      communityCards,
      playerCards,
      deck,
      isPendingToAddTokens,
      pendingCards,
    };
  }, [address, res]);

  const refresh = async () => {
    await refetch();
  };

  return (
    <div className=''>
      <GameOverlay contractAddress={contractAddress} refresh={refresh} />
      <div className='flex flex-col'>
        <div className='absolute right-1/2 top-24 mx-auto flex w-fit translate-x-1/2 flex-col gap-2'>
          <div className='text-center font-poker text-3xl font-medium text-neutral-200'>
            {data.currentRound}
          </div>
          <MotionNumber
            className='rounded-full border-2 border-[#70AF8A] bg-[#204D39] px-8 py-4 text-5xl'
            format={{ style: 'currency', currency: 'USD' }}
            value={data.potAmount}
          />
        </div>
        <GameStatistics
          highestBid={data.highestBet}
          nextTurn={data.nextTurn}
          winner={data.winnerAddress}
        />
      </div>
      <PlaceBet
        contractAddress={contractAddress}
        highestBet={data.highestBet}
        isMyTurn={data.nextTurn === 'Me'}
        refresh={refresh}
      />
      {data.gameEnded ? (
        <Results
          contractAddress={contractAddress}
          totalPlayers={data.playerCount}
        />
      ) : (
        <DeclareResult contractAddress={contractAddress} refresh={refresh} />
      )}
      <PlayerCards
        cards={data.playerCards}
        contractAddress={contractAddress}
        deck={data.deck}
      />
      <CommunityCards
        cards={data.communityCards}
        contractAddress={contractAddress}
      />
      <AddPendingCards
        contractAddress={contractAddress}
        deck={data.deck}
        isPending={data.isPendingToAddTokens}
        pendingCards={data.pendingCards}
        refresh={refresh}
      />
      {data.currentRound === 'End' && !data.gameEnded ? (
        <ChooseCards
          cards={data.communityCards}
          contractAddress={contractAddress}
        />
      ) : null}
      <div className='absolute bottom-48 right-12'>
        <Button
          className='flex h-10 w-10 flex-row items-center justify-center gap-2 rounded-full border-2 border-[#70AF8A] bg-[#204D39] !p-0 px-4 py-2 text-lg text-[#89d6a9]'
          onClick={refresh}
        >
          <RefreshCcw className='text-lg text-[#89d6a9]' />
        </Button>
      </div>
    </div>
  );
};

export default GamePage;