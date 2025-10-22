'use client';

import React from 'react';

import { gameConfig } from '~/lib/viem';

import { useAccount, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import type { OverlayProps } from '~/types';
import { useRouter } from 'next/navigation';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';

export const EndedOverlay = ({ contractAddress }: OverlayProps) => {
    const { address } = useAccount();
    const router = useRouter();

    const { data } = useReadContracts({
        query: {
            refetchInterval: 3000,
            gcTime: 0,
            staleTime: 0,
        },
        contracts: [
            {
                ...gameConfig,
                address: contractAddress,
                functionName: 'winner',
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_highestBet',
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_totalPlayers',
            },
        ],
    });

    const winnerData = data?.[0]?.result;
    const winnerAddress = winnerData?.[0] ?? '';
    const winnerWeight = winnerData?.[1] ?? 0n;
    const totalPot = data?.[1]?.result ?? 0n;
    const totalPlayersResult = data?.[2]?.result ?? 0n;
    const totalPlayers = typeof totalPlayersResult === 'bigint' ? totalPlayersResult : BigInt(totalPlayersResult);

    const isWinner = winnerAddress.toLowerCase() === address?.toLowerCase();
    const totalPotValue = totalPot * totalPlayers;

    return (
        <Overlay>
            <div className='flex w-full flex-col gap-6'>
                <div className='text-center font-poker text-5xl'>
                    {isWinner ? '🎉 You Won! 🎉' : 'Game Over'}
                </div>

                <div className='flex flex-col gap-4 rounded-2xl border-2 border-yellow-500 bg-black/40 p-6'>
                    <div className='text-center text-2xl font-bold text-yellow-400'>
                        Winner
                    </div>

                    <div className='text-center font-mono text-lg text-neutral-300'>
                        {winnerAddress.slice(0, 6)}...{winnerAddress.slice(-4)}
                        {isWinner && <span className='ml-2 text-green-400'>(You!)</span>}
                    </div>

                    <div className='text-center text-xl text-neutral-300'>
                        Winning Hand Strength: <span className='font-bold text-purple-400'>{winnerWeight.toString()}</span>
                    </div>

                    <div className='border-t border-neutral-600 pt-4'>
                        <div className='text-center text-3xl font-bold text-green-400'>
                            Prize: {formatEther(totalPotValue)} ETH
                        </div>
                    </div>
                </div>

                <div className='flex flex-col gap-2 text-center text-lg text-neutral-400'>
                    <div>Total Players: {String(totalPlayers)}</div>
                    <div>Pot per Player: {formatEther(totalPot)} ETH</div>
                </div>

                {Boolean(isWinner) && (
                    <div className='rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 text-center'>
                        <div className='font-poker text-2xl text-yellow-400'>
                            Congratulations! 🏆
                        </div>
                        <div className='mt-2 text-neutral-300'>
                            The winnings have been sent to your wallet
                        </div>
                    </div>
                )}

                <Button
                    className='mx-auto w-fit font-poker text-xl'
                    onClick={() => router.push('/game')}
                >
                    Back to Games
                </Button>

                <div className='text-center text-xs text-neutral-500'>
                    Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </div>
            </div>
        </Overlay>
    );
};
