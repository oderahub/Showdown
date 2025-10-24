'use client';

import { useRouter } from 'next/navigation';

import React, { useState } from 'react';

import { useShuffle } from '~/lib/hooks';
import { errorHandler } from '~/lib/utils';
import { gameConfig, gameFactoryConfig, wagmiConfig } from '~/lib/viem';

import { readContract, waitForTransactionReceipt, simulateContract } from '@wagmi/core';
import GoldBG from 'public/gold-bg.webp';
import PokerBG from 'public/poker-bg.jpg';
import { toast } from 'sonner';
import { isAddress, keccak256 } from 'viem';
import { useAccount, useWriteContract, useChainId } from 'wagmi';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

import { Button } from './ui/button';
import { Input } from './ui/input';

export const CreateGame = () => {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { getKey } = useShuffle();
  const router = useRouter();

  const [gameId, setGameId] = useState<string>('');

  // Strict wallet connection check: must be connected AND on Lisk Sepolia
  const walletConnected = status === 'connected' && Boolean(address) && chainId === 4202;

  const onCreate = async () => {
    if (!walletConnected) {
      toast.error('Please connect wallet to Lisk Sepolia (Chain ID: 4202)');
      return;
    }

    const id = toast.loading('Creating Game...');
    try {
      console.log('[CreateGame] Wallet:', address, 'Chain:', chainId);
      console.log('[CreateGame] GameFactory:', gameFactoryConfig.address);
      const salt = keccak256(Buffer.from(crypto.randomUUID()));
      const revealVerifier = '0x49cFFa95ffB77d398222393E3f0C4bFb5D996321';
      const key = await getKey(address);

      const hash = await writeContractAsync({
        ...gameFactoryConfig,
        functionName: 'createGame',
        args: [
          salt,
          revealVerifier,
          {
            addr: address,
            publicKey: {
              x: BigInt(key.pkxy[0]),
              y: BigInt(key.pkxy[1]),
            },
          },
        ],
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });
      const gameId = await readContract(wagmiConfig, {
        ...gameFactoryConfig,
        functionName: '_nextGameId',
        args: [],
      });
      const gameAddressRaw = await readContract(wagmiConfig, {
        ...gameFactoryConfig,
        functionName: '_games',
        args: [BigInt(Number(gameId) - 1)],
      });
      const gameAddress = gameAddressRaw as string;

      toast.success('Game Created Successfully!', {
        description: `ID: ${gameAddress}`,
        id,
      });

      router.push(`/game/${gameAddress}`);
    } catch (error) {
      console.log(error);
      toast.error(errorHandler(error), { id });
    }
  };

  const onJoin = async () => {
    if (!walletConnected) {
      toast.error('Please connect wallet to Lisk Sepolia (Chain ID: 4202)');
      return;
    }

    if (!gameId) {
      toast.error('Please enter a game ID');
      return;
    }

    const isValidId = isAddress(gameId);
    if (!isValidId) {
      toast.error('Invalid game ID. Must be a valid contract address.');
      return;
    }

    const id = toast.loading('Joining Game...');
    try {
      const contractAddress = gameId;
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

      toast.loading('Waiting for confirmation...', { id });

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

      if (Number(totalPlayers) < 2) {
        toast.warning(
          `Join transaction confirmed but player count is still ${String(totalPlayers)}. Please check the game page.`,
          { id, duration: 5000 }
        );
      } else {
        toast.success(`Game Joined! Total players: ${String(totalPlayers)}`, { id });
      }

      // Redirect to game page
      console.log('[JoinGame] Redirecting...');
      router.push(`/game/${contractAddress}`);
    } catch (error) {
      console.error('[JoinGame] Error:', error);
      toast.error(errorHandler(error), { id });
    }
  };

  return (
    <Dialog>
      <DialogTrigger>Create or Join a Game</DialogTrigger>
      <DialogContent>
        <div
          className='fixed left-[50%] top-[50%] z-50 flex translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[6rem] border bg-background p-3'
          style={{
            backgroundImage: `url(${GoldBG.src})`,
            objectFit: 'cover',
          }}
        >
          <div
            className='flex min-h-[20rem] w-full min-w-[36rem] flex-col items-center gap-4 rounded-[5rem] p-8'
            style={{
              backgroundImage: `url(${PokerBG.src})`,
              objectFit: 'cover',
            }}
          >
            <div className='font-poker text-5xl'>Create or Join a Game</div>
            {!address && (
              <div className='text-center text-lg text-yellow-500'>
                Please connect your wallet first!
              </div>
            )}
            <Button disabled={!walletConnected} onClick={onCreate}>
              Create Game
            </Button>
            <div>OR</div>
            <div className='flex flex-row items-center gap-2'>
              <Input
                className='w-[24rem] translate-x-12 !rounded-3xl border-none outline-none'
                disabled={!walletConnected}
                placeholder='Enter Game ID'
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <Button
                className='-translate-x-12 rounded-3xl'
                disabled={!walletConnected || !gameId}
                onClick={onJoin}
              >
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogTitle />
    </Dialog>
  );
};
