import Link from 'next/link';

import React from 'react';

import { getCurrentRound } from '~/lib/helpers';
import { gameConfig, gameFactoryConfig, wagmiConfig } from '~/lib/viem';

import { useQuery } from '@tanstack/react-query';
import { readContract, readContracts } from '@wagmi/core';
import { zeroAddress } from 'viem';

import { Button } from './ui/button';
import { TextCopy, TextCopyButton, TextCopyContent } from './ui/text-copy';

interface GameCardProps {
  id: string;
}

export const GameCard = ({ id }: GameCardProps) => {
  const { data: res } = useQuery({
    queryKey: ['game', id],
    queryFn: async () => {
      const addr = await readContract(wagmiConfig, {
        ...gameFactoryConfig,
        functionName: '_games',
        args: [BigInt(String(id))],
      });

      // Type assertion for game address
      const gameAddress = addr as `0x${string}`;

      const data = await readContracts(wagmiConfig, {
        contracts: [
          {
            ...gameConfig,
            address: gameAddress,
            functionName: '_totalPlayers',
            args: [],
          },
          {
            ...gameConfig,
            address: gameAddress,
            functionName: '_currentRound',
            args: [],
          },
        ],
      });

      // Type assertions for contract responses
      const totalPlayersResult = (data[0].result as bigint | undefined) ?? 0n;
      const currentRoundResult = (data[1].result as bigint | undefined) ?? 0n;

      return {
        gameAddress,
        totalPlayers: totalPlayersResult.toLocaleString(),
        currentRound: getCurrentRound(Number(currentRoundResult)),
      };
    },
  });

  return (
    <div className='flex max-w-xs flex-col rounded-3xl border bg-neutral-900 p-4'>
      <div className='flex flex-row items-center gap-3 text-lg font-medium'>
        <div>Game ID: </div>
        <div>{id}</div>
      </div>
      <div className='flex flex-row items-center gap-3 text-lg font-medium'>
        Game Address:{' '}
        <TextCopy
          toCopy={res?.gameAddress ?? zeroAddress}
          truncateOptions={{ length: 8, fromMiddle: false, enabled: true }}
          type='text'
        >
          <TextCopyContent />
          <TextCopyButton />
        </TextCopy>
      </div>
      <div className='flex flex-row items-center gap-3 text-lg font-medium'>
        <div>Total Players: </div>
        <div>{res?.totalPlayers}</div>
      </div>
      <div className='flex flex-row items-center gap-3 text-lg font-medium'>
        <div>Current Round: </div>
        <div>{res?.currentRound}</div>
      </div>
      <Link className='my-4' href={`/game/${res?.gameAddress ?? zeroAddress}`}>
        <Button className='h-8 w-full rounded-3xl'>Join</Button>
      </Link>
    </div>
  );
};