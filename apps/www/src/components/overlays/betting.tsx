'use client';

import React, { useState, useEffect, useRef } from 'react';

import { errorHandler, getErrorAction } from '~/lib/utils';
import { getCurrentRound } from '~/lib/helpers';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import type { OverlayProps, Player } from '~/types';
import { Clock, AlertTriangle } from 'lucide-react';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

export const BettingOverlay = ({ contractAddress, refresh }: OverlayProps) => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [betAmount, setBetAmount] = useState<string>('0.01');
    const [showFoldDialog, setShowFoldDialog] = useState(false);
    const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(120);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { data } = useReadContracts({
        contracts: [
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: '_currentRound',
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: '_highestBet',
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: '_bets',
                args: [address ?? '0x0'],
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: 'nextPlayer',
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: 'getTimeRemaining',
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: '_totalPlayers',
                chainId: gameConfig.chainId,
            },
            {
                abi: gameConfig.abi,
                address: contractAddress,
                functionName: '_totalFolds',
                chainId: gameConfig.chainId,
            },
        ],
        query: {
            refetchInterval: 1000,
        },
    });

    const currentRound = Number(data?.[0]?.result ?? 0);
    const highestBet = (data?.[1]?.result as bigint | undefined) ?? 0n;
    const myBet = (data?.[2]?.result as bigint | undefined) ?? 0n;
    const nextPlayerData = data?.[3]?.result as Player | undefined;
    const nextPlayerAddress = nextPlayerData?.addr ?? '';
    const contractTimeRemaining = Number(data?.[4]?.result ?? 120);
    const totalPlayers = Number((data?.[5]?.result as bigint | undefined) ?? 0n);
    const totalFolds = Number((data?.[6]?.result as bigint | undefined) ?? 0n);
    const playersRemaining = totalPlayers - totalFolds;

    const isMyTurn = nextPlayerAddress.toLowerCase() === address?.toLowerCase();
    const roundName = getCurrentRound(currentRound);
    const callAmount = highestBet > myBet ? highestBet - myBet : 0n;
    const isTimeExpired = localTimeRemaining === 0;

    // Sync local timer with contract data
    useEffect(() => {
        setLocalTimeRemaining(contractTimeRemaining);
    }, [contractTimeRemaining]);

    // Client-side countdown for smooth timer display - restart when turn changes
    useEffect(() => {
        // Clear any existing interval
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        // Reset local timer to contract value when turn changes
        setLocalTimeRemaining(contractTimeRemaining);

        // Start countdown
        timerIntervalRef.current = setInterval(() => {
            setLocalTimeRemaining((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        // Cleanup on unmount
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [nextPlayerAddress, contractTimeRemaining]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins)}:${String(secs).padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (localTimeRemaining <= 10) return 'text-red-500';
        if (localTimeRemaining <= 30) return 'text-orange-500';
        return 'text-green-500';
    };

    const onForceFold = async () => {
        const id = toast.loading('Force folding inactive player...');
        try {
            const hash = await writeContractAsync({
                ...gameConfig,
                address: contractAddress,
                functionName: 'forceFold',
            });
            await waitForTransactionReceipt(wagmiConfig, { hash });
            toast.success('Player force-folded due to timeout', { id });
            if (refresh) await refresh();
        } catch (error) {
            console.error('Force fold error:', error);
            const errorMessage = errorHandler(error);
            const suggestion = getErrorAction(errorMessage);

            toast.error(errorMessage, {
                id,
                description: suggestion ?? 'The 2-minute timeout must fully expire before force folding.',
                duration: 5000,
            });
        }
    };

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
                value: amount, // CRITICAL: Send ETH with the transaction
            });

            toast.loading('Confirming transaction...', { id });
            await waitForTransactionReceipt(wagmiConfig, { hash, timeout: 60_000 });

            toast.success('Bet placed!', { id });
            setBetAmount('0.01');

            if (refresh) await refresh();
        } catch (error) {
            console.error('[PlaceBet] Error:', error);
            const errorMessage = errorHandler(error);
            const suggestion = getErrorAction(errorMessage);

            // Show error with suggestion
            toast.error(errorMessage, {
                id,
                description: suggestion ?? undefined,
                duration: 5000, // Show for 5 seconds
            });
        }
    };

    const onFold = async () => {
        setShowFoldDialog(false); // Close dialog
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
            const errorMessage = errorHandler(error);
            const suggestion = getErrorAction(errorMessage);

            toast.error(errorMessage, {
                id,
                description: suggestion ?? undefined,
                duration: 5000,
            });
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
        <Overlay minimizable title={`${roundName} Round`} variant='compact'>
            <div className='flex w-full flex-col gap-3'>
                <div className='text-center font-poker text-4xl'>{roundName} Round</div>

                <div className='flex flex-col gap-2 text-center text-lg'>
                    <div className='text-neutral-300'>
                        Highest Bet: <span className='font-bold text-yellow-500'>{formatEther(highestBet)} ETH</span>
                    </div>
                    <div className='text-neutral-300'>
                        Your Bet: <span className='font-bold text-green-500'>{formatEther(myBet)} ETH</span>
                    </div>
                    {Boolean(callAmount > 0n) && (
                        <div className='text-neutral-300'>
                            To Call: <span className='font-bold text-orange-500'>{formatEther(callAmount)} ETH</span>
                        </div>
                    )}
                </div>

                {/* Action Timer */}
                <div className='flex flex-col items-center gap-2'>
                    <div className={`flex items-center gap-2 ${getTimerColor()} font-mono text-3xl font-bold transition-all duration-300 ${localTimeRemaining <= 10 ? 'animate-pulse scale-110' : ''}`}>
                        <Clock className={`h-7 w-7 ${localTimeRemaining <= 10 ? 'animate-spin' : ''}`} />
                        <span>{formatTime(localTimeRemaining)}</span>
                    </div>
                    <div className='text-center text-sm text-neutral-400'>
                        {isMyTurn ? (
                            <span className='font-bold text-green-400'>🎯 Your Turn!</span>
                        ) : (
                            <span>Waiting for: {nextPlayerAddress.slice(0, 6)}...{nextPlayerAddress.slice(-4)}</span>
                        )}
                    </div>
                </div>

                {/* Force Fold Warning */}
                {Boolean(isTimeExpired && !isMyTurn) && (
                    <div className='flex flex-col items-center gap-2 rounded-lg bg-red-500/10 p-4'>
                        <div className='flex items-center gap-2 text-red-500'>
                            <AlertTriangle className='h-5 w-5 animate-pulse' />
                            <span className='font-semibold'>Player Timeout!</span>
                        </div>
                        <Button
                            className='animate-pulse'
                            size='sm'
                            variant='destructive'
                            onClick={onForceFold}
                        >
                            Force Fold Inactive Player
                        </Button>
                    </div>
                )}

                {Boolean(isTimeExpired && isMyTurn) && (
                    <div className='flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-500'>
                        <AlertTriangle className='h-5 w-5 animate-pulse' />
                        <span className='text-sm font-semibold'>Your time is up! Act now or be force-folded.</span>
                    </div>
                )}

                {Boolean(isMyTurn) && (
                    <>
                        <div className='flex flex-col gap-2'>
                            <label className='text-center font-poker text-xl text-neutral-300' htmlFor='bet-amount'>
                                Bet Amount (ETH)
                            </label>
                            <Input
                                className='rounded-xl border-2 border-yellow-600 bg-neutral-800 text-center text-xl font-bold text-white'
                                id='bet-amount'
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
                                onClick={() => setShowFoldDialog(true)}
                            >
                                Fold
                            </Button>
                        </div>
                    </>
                )}

                <div className='text-center text-xs text-neutral-500'>
                    Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className='text-center text-xs text-neutral-600'>
                        Debug: Next player = {nextPlayerAddress || 'none'}
                    </div>
                )}
            </div>

            {/* Fold Confirmation Dialog */}
            <Dialog open={showFoldDialog} onOpenChange={setShowFoldDialog}>
                <DialogContent className='sm:max-w-[425px]'>
                    <DialogHeader>
                        <DialogTitle className='flex items-center gap-2 text-xl'>
                            <AlertTriangle className='h-6 w-6 text-red-500' />
                            Confirm Fold
                        </DialogTitle>
                        <DialogDescription className='space-y-3 pt-4'>
                            <p className='text-base'>
                                Are you sure you want to fold? You will forfeit your stake and exit this round.
                            </p>
                            <div className='rounded-lg bg-red-500/10 p-3 text-sm text-red-500'>
                                <span className='font-semibold'>Warning:</span> Once you fold, you cannot rejoin this game.
                                Your bet will be lost.
                            </div>
                            {Boolean(playersRemaining === 2) && (
                                <div className='rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600'>
                                    Only 2 players remaining. If you fold, the other player will win automatically.
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='gap-2 sm:gap-0'>
                        <Button
                            variant='outline'
                            onClick={() => setShowFoldDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className='bg-red-600 hover:bg-red-700'
                            variant='destructive'
                            onClick={onFold}
                        >
                            Yes, Fold
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Overlay>
    );
};