'use client';

import React, { useState } from 'react';

import { errorHandler } from '~/lib/utils';
import { getCurrentRound } from '~/lib/helpers';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import type { OverlayProps } from '~/types';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const BettingOverlay = ({ contractAddress, refresh }: OverlayProps) => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [betAmount, setBetAmount] = useState<string>('0.01');

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
                functionName: '_currentRound',
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_highestBet',
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_bets',
                args: [address ?? '0x0'],
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: 'nextPlayer',
            },
        ],
    });

    const currentRound = Number(data?.[0]?.result ?? 0);
    const highestBet = data?.[1]?.result ?? 0n;
    const myBet = data?.[2]?.result ?? 0n;
    const nextPlayerResult = data?.[3]?.result;
    const nextPlayer = typeof nextPlayerResult === 'string' ? nextPlayerResult : '';

    const isMyTurn = nextPlayer.toLowerCase() === address?.toLowerCase();
    const roundName = getCurrentRound(currentRound);
    const callAmount = highestBet > myBet ? highestBet - myBet : 0n;

    const onPlaceBet = async () => {
        const id = toast.loading('Placing bet...');
        try {
            const amount = parseEther(betAmount);

            if (amount < callAmount) {
                throw new Error(`Minimum bet is ${formatEther(callAmount)} ETH to call`);
            }

            const hash = await writeContractAsync({
                ...gameConfig,
                address: contractAddress,
                functionName: 'placeBet',
                args: [amount],
            });

            toast.loading('Confirming transaction...', { id });
            await waitForTransactionReceipt(wagmiConfig, { hash, timeout: 60_000 });

            toast.success('Bet placed!', { id });
            setBetAmount('0.01');

            if (refresh) await refresh();
        } catch (error) {
            console.error('[PlaceBet] Error:', error);
            toast.error(errorHandler(error), { id });
        }
    };

    const onFold = async () => {
        const id = toast.loading('Folding...');
        try {
            const hash = await writeContractAsync({
                ...gameConfig,
                address: contractAddress,
                functionName: 'fold',
            });

            toast.loading('Confirming transaction...', { id });
            await waitForTransactionReceipt(wagmiConfig, { hash, timeout: 60_000 });

            toast.success('You folded', { id });

            if (refresh) await refresh();
        } catch (error) {
            console.error('[Fold] Error:', error);
            toast.error(errorHandler(error), { id });
        }
    };

    const onCall = () => {
        if (callAmount === 0n) {
            setBetAmount('0');
            setTimeout(() => void onPlaceBet(), 100);
            return;
        }

        setBetAmount(formatEther(callAmount));
        setTimeout(() => void onPlaceBet(), 100);
    };

    return (
        <Overlay>
            <div className='flex w-full flex-col gap-4'>
                <div className='text-center font-poker text-4xl'>{roundName} Round</div>

                <div className='flex flex-col gap-2 text-center text-lg'>
                    <div className='text-neutral-300'>
                        Highest Bet: <span className='font-bold text-yellow-500'>{formatEther(highestBet)} ETH</span>
                    </div>
                    <div className='text-neutral-300'>
                        Your Bet: <span className='font-bold text-green-500'>{formatEther(myBet)} ETH</span>
                    </div>
                    {callAmount > 0n && (
                        <div className='text-neutral-300'>
                            To Call: <span className='font-bold text-orange-500'>{formatEther(callAmount)} ETH</span>
                        </div>
                    )}
                </div>

                <div className='text-center text-sm text-neutral-400'>
                    {isMyTurn ? (
                        <span className='font-bold text-green-400'>🎯 Your Turn!</span>
                    ) : (
                        <span>Waiting for: {nextPlayer.slice(0, 6)}...{nextPlayer.slice(-4)}</span>
                    )}
                </div>

                {Boolean(isMyTurn) && (
                    <>
                        <div className='flex flex-col gap-2'>
                            <label htmlFor='bet-amount' className='text-center font-poker text-xl text-neutral-300'>
                                Bet Amount (ETH)
                            </label>
                            <Input
                                id='bet-amount'
                                className='rounded-xl border-2 border-yellow-600 bg-neutral-800 text-center text-xl font-bold text-white'
                                disabled={!isMyTurn}
                                min='0'
                                placeholder='0.01'
                                step='0.01'
                                type='number'
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                            />
                        </div>

                        <div className='flex flex-wrap justify-center gap-3'>
                            {callAmount === 0n ? (
                                <Button
                                    className='font-poker text-lg'
                                    variant='secondary'
                                    onClick={() => {
                                        setBetAmount('0');
                                        setTimeout(() => void onPlaceBet(), 100);
                                    }}
                                >
                                    Check (Bet 0)
                                </Button>
                            ) : (
                                <Button
                                    className='bg-green-600 font-poker text-lg hover:bg-green-700'
                                    onClick={onCall}
                                >
                                    Call {formatEther(callAmount)} ETH
                                </Button>
                            )}

                            <Button
                                className='bg-blue-600 font-poker text-lg hover:bg-blue-700'
                                onClick={onPlaceBet}
                            >
                                Raise {betAmount} ETH
                            </Button>

                            <Button
                                className='bg-red-600 font-poker text-lg hover:bg-red-700'
                                variant='destructive'
                                onClick={onFold}
                            >
                                Fold
                            </Button>
                        </div>
                    </>
                )}

                <div className='text-center text-xs text-neutral-500'>
                    Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </div>
            </div>
        </Overlay>
    );
};
