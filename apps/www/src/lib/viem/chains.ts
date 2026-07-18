import { avalancheFuji, liskSepolia } from 'viem/chains';

export { avalancheFuji, liskSepolia };

export type SupportedChainId =
  | typeof liskSepolia.id
  | typeof avalancheFuji.id;

/**
 * Deployed contract addresses, per chain.
 *
 * Lisk Sepolia is the original prototype deployment. Avalanche Fuji is the
 * migration target -- fill these in after running:
 *
 *   forge script script/Deploy.s.sol --rpc-url fuji --broadcast
 *
 * SHUFFLE_VERIFIER is only meaningful once on-chain shuffle verification is
 * wired into Game.sol; until then the game verifies shuffle proofs client-side
 * and this address is unused. See README "Security Model".
 */
export const CONTRACTS: Record<
  SupportedChainId,
  { GAME_FACTORY: `0x${string}`; REVEAL_VERIFIER: `0x${string}`; SHUFFLE_VERIFIER?: `0x${string}` }
> = {
  [liskSepolia.id]: {
    GAME_FACTORY: '0xe86553AE8f33924b5B7174F64ceaCbeff473548D',
    REVEAL_VERIFIER: '0x49cFFa95ffB77d398222393E3f0C4bFb5D996321',
  },
  [avalancheFuji.id]: {
    // Not yet deployed -- see roadmap milestone 1.
    GAME_FACTORY: '0x0000000000000000000000000000000000000000',
    REVEAL_VERIFIER: '0x0000000000000000000000000000000000000000',
  },
};

export const RPC_URLS: Record<SupportedChainId, string> = {
  [liskSepolia.id]: 'https://rpc.sepolia-api.lisk.com',
  [avalancheFuji.id]: 'https://api.avax-test.network/ext/bc/C/rpc',
};

/**
 * The chain the app talks to. Override with NEXT_PUBLIC_CHAIN_ID to point a
 * build at Fuji without touching code.
 */
const configuredChainId = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? liskSepolia.id
) as SupportedChainId;

export const activeChain =
  configuredChainId === avalancheFuji.id ? avalancheFuji : liskSepolia;

export const activeContracts = CONTRACTS[activeChain.id];
