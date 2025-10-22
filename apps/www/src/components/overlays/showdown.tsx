'use client';

import React, { useState } from 'react';

import { errorHandler } from '~/lib/utils';
import { getPokerCardImage } from '~/lib/helpers';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { useReadContracts, useWriteContract } from 'wagmi';
import type { OverlayProps } from '~/types';
import Image from 'next/image';

import { Overlay } from '../overlay';
import { Button } from '../ui/button';

export const ShowdownOverlay = ({ contractAddress, refresh }: OverlayProps) => {
    const { writeContractAsync } = useWriteContract();
    const [selectedCards, setSelectedCards] = useState<number[]>([]);

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
                functionName: '_communityCards',
                args: [0n],
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_communityCards',
                args: [1n],
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_communityCards',
                args: [2n],
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_communityCards',
                args: [3n],
            },
            {
                ...gameConfig,
                address: contractAddress,
                functionName: '_communityCards',
                args: [4n],
            },
        ],
    });

    const communityCards = [
        Number(data?.[0]?.result ?? 0),
        Number(data?.[1]?.result ?? 0),
        Number(data?.[2]?.result ?? 0),
        Number(data?.[3]?.result ?? 0),
        Number(data?.[4]?.result ?? 0),
    ];

    const toggleCard = (cardIndex: number) => {
        if (selectedCards.includes(cardIndex)) {
            setSelectedCards(selectedCards.filter((i) => i !== cardIndex));
            return;
        }

        if (selectedCards.length < 3) {
            setSelectedCards([...selectedCards, cardIndex]);
        } else {
            toast.warning('You can only select 3 cards');
        }
    };

    const onSubmitCards = async () => {
        if (selectedCards.length !== 3) {
            toast.error('Please select exactly 3 cards');
            return;
        }

        const id = toast.loading('Submitting winning cards...');
        try {
            const cardValues = selectedCards.map((i) => communityCards[i]);

            const hash = await writeContractAsync({
                ...gameConfig,
                address: contractAddress,
                functionName: 'chooseCards',
                args: [cardValues as [number, number, number]],
            });

            toast.loading('Confirming transaction...', { id });
            await waitForTransactionReceipt(wagmiConfig, { hash, timeout: 60_000 });

            toast.success('Cards submitted!', { id });

            if (refresh) await refresh();
        } catch (error) {
            console.error('[ChooseCards] Error:', error);
            toast.error(errorHandler(error), { id });
        }
    };

    return (
        <Overlay>
            <div className='flex w-full flex-col gap-6'>
                <div className='text-center font-poker text-4xl'>Showdown!</div>

                <div className='text-center font-poker text-xl text-neutral-300'>
                    Select your 3 best cards from the community
                </div>

                <div className='flex justify-center gap-3'>
                    {communityCards.map((cardId, index) => (
                        <button
                            key={`card-${String(cardId)}-${String(index)}`}
                            type='button'
                            className={`
                relative transform transition-all duration-200 hover:scale-110
                ${selectedCards.includes(index) ? 'ring-4 ring-yellow-500 scale-105' : ''}
              `}
                            onClick={() => toggleCard(index)}
                        >
                            <Image
                                alt={`Card ${String(index + 1)}`}
                                className='rounded-lg shadow-xl'
                                height={140}
                                src={getPokerCardImage(cardId)}
                                width={100}
                            />
                            {selectedCards.includes(index) && (
                                <div className='absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 font-bold text-black'>
                                    {selectedCards.indexOf(index) + 1}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className='text-center text-lg text-neutral-400'>
                    Selected: {selectedCards.length} / 3
                </div>

                <div className='flex justify-center gap-3'>
                    <Button
                        className='font-poker text-lg'
                        disabled={selectedCards.length === 0}
                        variant='secondary'
                        onClick={() => setSelectedCards([])}
                    >
                        Clear Selection
                    </Button>

                    <Button
                        className='bg-green-600 font-poker text-lg hover:bg-green-700'
                        disabled={selectedCards.length !== 3}
                        onClick={onSubmitCards}
                    >
                        Submit Cards
                    </Button>
                </div>

                <div className='text-center text-xs text-neutral-500'>
                    Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </div>
            </div>
        </Overlay>
    );
};
