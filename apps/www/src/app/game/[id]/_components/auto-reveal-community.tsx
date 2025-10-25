import { useEffect, useRef } from 'react';

import { useShuffle } from '~/lib/hooks';
import { getRevealKeys } from '~/lib/shuffle';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { type Hex, hexToBigInt } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

interface AutoRevealCommunityProps {
  contractAddress: `0x${string}`;
  pendingCommunityCards: number[];
  deck: Hex[][];
  refresh: () => Promise<void>;
}

/**
 * Automatically submits reveal tokens for community cards.
 * Community cards should be PUBLIC in poker - visible to all players immediately.
 * This component auto-submits reveal tokens so community cards become visible as soon as possible.
 */
export const AutoRevealCommunity = ({
  contractAddress,
  pendingCommunityCards,
  deck,
  refresh,
}: AutoRevealCommunityProps) => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const { getKey } = useShuffle();
  const isSubmittingRef = useRef(false);
  const lastSubmittedRef = useRef<string>('');

  useEffect(() => {
    const submitRevealTokens = async () => {
      // Guard: Check if already submitting
      if (isSubmittingRef.current) return;

      // Guard: Check if we have pending community cards
      if (pendingCommunityCards.length === 0) return;

      // Guard: Check if wallet connected
      if (!address) return;

      // Generate unique key for this set of cards to avoid duplicate submissions
      const cardKey = pendingCommunityCards.sort((a, b) => a - b).join(',');
      if (lastSubmittedRef.current === cardKey) return;

      try {
        isSubmittingRef.current = true;
        console.log('[AutoReveal] Submitting reveal tokens for community cards:', pendingCommunityCards);

        const cards: [Hex, Hex, Hex, Hex][] = [];
        for (const i of pendingCommunityCards) {
          cards.push(deck[i] as [Hex, Hex, Hex, Hex]);
        }

        const key = await getKey(address);
        const tokens = await getRevealKeys(cards, key.sk);

        const revealTokens = tokens.revealKeys.map((t) => ({
          player: address,
          token: {
            x: hexToBigInt(t.card[0]),
            y: hexToBigInt(t.card[1]),
          },
        }));

        const hash = await writeContractAsync({
          ...gameConfig,
          address: contractAddress,
          functionName: 'addMultipleRevealTokens',
          args: [pendingCommunityCards, revealTokens],
        });

        await waitForTransactionReceipt(wagmiConfig, { hash });

        // Mark as submitted
        lastSubmittedRef.current = cardKey;

        console.log('[AutoReveal] Community cards revealed successfully');
        await refresh();
      } catch (error) {
        console.error('[AutoReveal] Failed to submit reveal tokens:', error);
        // Reset to allow retry
        isSubmittingRef.current = false;
      } finally {
        isSubmittingRef.current = false;
      }
    };

    void submitRevealTokens();
  }, [address, contractAddress, deck, getKey, pendingCommunityCards, refresh, writeContractAsync]);

  return null; // This is a headless component
};
