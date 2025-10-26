'use client';

import { useRouter } from 'next/navigation';

import React, { useState } from 'react';

import { getCurrentRound } from '~/lib/helpers';
import { useShuffle } from '~/lib/hooks';
import { errorHandler } from '~/lib/utils';
import { gameConfig, gameFactoryConfig, wagmiConfig } from '~/lib/viem';

import { useQuery } from '@tanstack/react-query';
import { readContract, readContracts, waitForTransactionReceipt, simulateContract } from '@wagmi/core';
import { toast } from 'sonner';
import { zeroAddress } from 'viem';
import { useAccount, useWriteContract, useChainId } from 'wagmi';

import { Button } from './ui/button';
import { TextCopy, TextCopyButton, TextCopyContent } from './ui/text-copy';

interface GameCardProps {
  id: string;
}

export const GameCard = ({ id }: GameCardProps) => {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { getKey } = useShuffle();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  // Strict wallet connection check
  const walletConnected = status === 'connected' && Boolean(address) && chainId === 4202;

  const { data: res, refetch } = useQuery({
    queryKey: ['game', id, address],
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
          {
            ...gameConfig,
            address: gameAddress,
            functionName: '_isPlayer',
            args: [address ?? zeroAddress],
          },
          {
            ...gameConfig,
            address: gameAddress,
            functionName: '_gameStarted',
            args: [],
          },
        ],
      });

      // Type assertions for contract responses
      const totalPlayersResult = (data[0].result as bigint | undefined) ?? 0n;
      const currentRoundResult = (data[1].result as bigint | undefined) ?? 0n;
      const isPlayerResult = (data[2].result as boolean | undefined) ?? false;
      const gameStartedResult = (data[3].result as boolean | undefined) ?? false;

      return {
        gameAddress,
        totalPlayers: totalPlayersResult.toLocaleString(),
        currentRound: getCurrentRound(Number(currentRoundResult)),
        isPlayer: isPlayerResult,
        gameStarted: gameStartedResult,
      };
    },
  });

  const onJoinGame = async () => {
    if (!walletConnected) {
      toast.error('Please connect wallet to Lisk Sepolia (Chain ID: 4202)');
      return;
    }

    if (!res?.gameAddress) {
      toast.error('Game address not found');
      return;
    }

    setIsJoining(true);
    const toastId = toast.loading('Joining Game...');

    try {
      const contractAddress = res.gameAddress;
      console.log('[JoinGame] Wallet:', address, 'Chain:', chainId);
      console.log('[JoinGame] Contract:', contractAddress);

      const key = await getKey(address);
      console.log('[JoinGame] Public key generated');

      // Simulate transaction first to catch errors early
      console.log('[JoinGame] Simulating transaction...');
      await simulateContract(wagmiConfig, {
        ...gameConfig,
        address: contractAddress,
        functionName: 'joinGame',
        account: address,
        args: [
          {
            addr: address,
            publicKey: {
              x: BigInt(key.pkxy[0]),
              y: BigInt(key.pkxy[1]),
            },
          },
        ],
      });
      console.log('[JoinGame] Simulation successful');

      const hash = await writeContractAsync({
        ...gameConfig,
        address: contractAddress,
        functionName: 'joinGame',
        args: [
          {
            addr: address,
            publicKey: {
              x: BigInt(key.pkxy[0]),
              y: BigInt(key.pkxy[1]),
            },
          },
        ],
        gas: 500000n,
      });

      toast.loading('Waiting for confirmation...', { id: toastId });

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        timeout: 60_000,
      });

      console.log('[JoinGame] Transaction confirmed:', receipt);

      // Verify on-chain player count increased
      console.log('[JoinGame] Verifying player count...');
      const totalPlayers = await readContract(wagmiConfig, {
        ...gameConfig,
        address: contractAddress,
        functionName: '_totalPlayers',
      });

      console.log('[JoinGame] _totalPlayers after join:', String(totalPlayers));

      toast.success(`Game Joined! Total players: ${String(totalPlayers)}`, { id: toastId });

      // Refetch game data to update UI
      await refetch();

      // Redirect to game page
      console.log('[JoinGame] Redirecting...');
      router.push(`/game/${contractAddress}`);
    } catch (error) {
      console.error('[JoinGame] Error:', error);
      toast.error(errorHandler(error), { id: toastId });
    } finally {
      setIsJoining(false);
    }
  };

  const onViewGame = () => {
    if (res?.gameAddress) {
      router.push(`/game/${res.gameAddress}`);
    }
  };

  // Determine button state
  const getButtonConfig = () => {
    if (!walletConnected) {
      return { text: 'Connect Wallet', disabled: true, onClick: onViewGame };
    }

    if (!res) {
      return { text: 'Loading...', disabled: true, onClick: onViewGame };
    }

    if (res.isPlayer) {
      return { text: 'View Game', disabled: false, onClick: onViewGame };
    }

    if (res.gameStarted) {
      return { text: 'Game Started', disabled: true, onClick: onViewGame };
    }

    return { text: 'Join Game', disabled: isJoining, onClick: onJoinGame };
  };

  const buttonConfig = getButtonConfig();

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
      <Button
        className='my-4 h-8 w-full rounded-3xl'
        disabled={buttonConfig.disabled}
        onClick={buttonConfig.onClick}
      >
        {buttonConfig.text}
      </Button>
    </div>
  );
};