import { useEffect, useRef } from 'react';

import { useShuffle } from '~/lib/hooks';
import { getRevealKeys } from '~/lib/shuffle';
import { gameConfig, wagmiConfig } from '~/lib/viem';

import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'sonner';
import { type Hex, hexToBigInt } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

interface AutoRevealPlayerProps {
  contractAddress: `0x${string}`;
  pendingPlayerCards: number[];
  deck: Hex[][];
  refresh: () => Promise<void>;
}

/**
 * Automatically submits reveal tokens for player hole cards.
 * In mental poker, to decrypt your own hole cards, you need reveal tokens from ALL OTHER players.
 * This component auto-submits YOUR reveal tokens so OTHER players can see THEIR hole cards.
 * Vice versa, once other players auto-submit, YOU can see YOUR hole cards.
 */
export const AutoRevealPlayer = ({
  contractAddress,
  pendingPlayerCards,
  deck,
  refresh,
}: AutoRevealPlayerProps) => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const { getKey } = useShuffle();
  const isSubmittingRef = useRef(false);
  const lastSubmittedRef = useRef<string>('');

  // Create stable cardKey for dependency tracking
  const cardKey = pendingPlayerCards.length > 0
    ? [...pendingPlayerCards].sort((a, b) => a - b).join(',')
    : '';

  useEffect(() => {
    const submitRevealTokens = async () => {
      // Guard: Check if already submitting
      if (isSubmittingRef.current) {
        console.log('[AutoRevealPlayer] Already submitting, skipping...');
        return;
      }

      // Guard: Check if we have pending player cards
      if (pendingPlayerCards.length === 0) return;

      // Guard: Check if wallet connected
      if (!address) return;

      // Guard: Check if already submitted this set of cards
      if (lastSubmittedRef.current === cardKey) {
        console.log('[AutoRevealPlayer] Already submitted these cards, skipping...');
        return;
      }

      // Guard: Check if we have deck data
      if (deck.length === 0) {
        console.log('[AutoRevealPlayer] Deck not ready, skipping...');
        return;
      }

      // Show info toast explaining what's about to happen
      const infoToastId = toast.info(
        'Submitting reveal tokens to decrypt cards...',
        {
          description: 'Please approve the wallet transaction. This helps all players see their hole cards.',
          duration: 10000,
        }
      );

      try {
        isSubmittingRef.current = true;
        console.log('[AutoRevealPlayer] Submitting reveal tokens for player cards:', pendingPlayerCards);

        const cards: [Hex, Hex, Hex, Hex][] = [];
        for (const i of pendingPlayerCards) {
          if (!deck[i]) {
            console.error('[AutoRevealPlayer] Card not found in deck:', i);
            toast.dismiss(infoToastId);
            return;
          }
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

        // Dismiss info toast and show loading
        toast.dismiss(infoToastId);
        const loadingToastId = toast.loading('Waiting for transaction confirmation...');

        const hash = await writeContractAsync({
          ...gameConfig,
          address: contractAddress,
          functionName: 'addMultipleRevealTokens',
          args: [pendingPlayerCards, revealTokens],
        });

        await waitForTransactionReceipt(wagmiConfig, { hash });

        // Mark as submitted BEFORE refresh to prevent race condition
        lastSubmittedRef.current = cardKey;

        console.log('[AutoRevealPlayer] Player cards reveal tokens submitted successfully');

        toast.success('Reveal tokens submitted!', {
          id: loadingToastId,
          description: 'Your cards will decrypt once all players submit their tokens.',
        });

        await refresh();
      } catch (error) {
        console.error('[AutoRevealPlayer] Failed to submit reveal tokens:', error);
        toast.dismiss(infoToastId);
        toast.error('Failed to submit reveal tokens', {
          description: error instanceof Error ? error.message : 'Please try refreshing the page',
        });
        // Reset to allow retry on next effect run
        isSubmittingRef.current = false;
      } finally {
        isSubmittingRef.current = false;
      }
    };

    void submitRevealTokens();
    // Only depend on data values that actually change, not function references.
    // getKey, refresh, writeContractAsync are used but omitted to prevent re-triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally omitting function deps to prevent duplicate transactions
  }, [address, contractAddress, cardKey]);

  return null; // This is a headless component
};
