import React from 'react';

import { truncate } from '~/lib/utils';

import MotionNumber from 'motion-number';
import { formatEther, type Address } from 'viem';
import { PokerBox } from '~/components';

interface GameStatisticsProps {
  highestBid: number;
  winner: Address;
  nextTurn: string;
}

export const GameStatistics = ({
  highestBid,
  winner,
  nextTurn,
}: GameStatisticsProps) => {
  // Convert Wei to ETH for display
  const highestBidInEth = parseFloat(formatEther(BigInt(highestBid)));

  return (
    <div className='absolute right-12 top-24 flex flex-col items-center gap-3 text-xl'>
      <PokerBox className='flex w-[24rem] flex-col gap-2 px-6 py-4 text-lg'>
        <div className='flex flex-row justify-between gap-4'>
          <div className='whitespace-nowrap'>Highest Bet:</div>
          <div className='flex items-center gap-1 overflow-hidden'>
            <MotionNumber
              className='text-xl font-bold tabular-nums'
              value={highestBidInEth}
            />
            <span className='text-sm text-yellow-400'>ETH</span>
          </div>
        </div>
        <div className='flex flex-row justify-between gap-4'>
          <div className='whitespace-nowrap'>Winner:</div>
          <div className='overflow-hidden text-ellipsis'>{truncate(winner, 8)}</div>
        </div>
        <div className='flex flex-row justify-between gap-4'>
          <div className='whitespace-nowrap'>Next Turn:</div>
          <div className='overflow-hidden text-ellipsis font-bold text-green-400'>{nextTurn}</div>
        </div>
      </PokerBox>
    </div>
  );
};
