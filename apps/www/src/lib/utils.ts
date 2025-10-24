import { type ClassValue, clsx } from 'clsx';
import { serializeError } from 'serialize-error';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (
  str: string,
  length?: number,
  fromMiddle?: boolean
) => {
  const middle = fromMiddle ?? true;
  const len = length ?? 20;
  if (str.length <= len) {
    return str;
  }
  if (middle) {
    return `${str.slice(0, len / 2)}...${str.slice(-len / 2)}`;
  }
  return `${str.slice(0, len)}...`;
};

// Contract error name to user-friendly message mapping
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // Game errors
  InvalidBetAmount: '🎰 Your bet is too low! You must match or raise the current highest bet.',
  IncorrectBetAmount: '💰 The ETH amount sent doesn\'t match your bet amount.',
  InvalidBetSequence: '⏳ Not your turn yet! Please wait for other players.',
  NotAPlayer: '🚫 You are not in this game.',
  AlreadyAPlayer: '👥 You have already joined this game.',
  GameNotStarted: '⏸️ The game hasn\'t started yet.',
  GameAlreadyStarted: '▶️ The game has already started.',
  GameEnded: '🏁 The game has ended.',
  GameNotEnded: '⏳ The game is still in progress.',
  NotEnoughPlayers: '👥 Need at least 2 players to start.',
  PlayerFolded: '🃏 You have already folded.',
  AlreadyFolded: '🃏 This player has already folded.',
  ActionTimeoutNotExpired: '⏱️ Cannot force fold yet - timeout hasn\'t expired.',
  NotShuffled: '🔀 All players must shuffle first.',
  WinnerAlreadyDeclared: '🏆 Winner has already been declared.',
  NotACommunityCard: '🃏 Invalid card - must choose from community cards.',
  DuplicateCommunityCard: '🃏 Cannot choose the same card twice.',
  TransferFailed: '💸 ETH transfer failed. Please try again.',
  NoWinningsToWithdraw: '💰 No winnings available to withdraw.',
  NotWinner: '🏆 Only the winner can withdraw.',

  // Common blockchain errors
  'insufficient funds': '💳 Insufficient funds in your wallet.',
  'user rejected': '✋ Transaction cancelled by user.',
  'nonce too low': '🔄 Transaction nonce error. Please try again.',
  'gas required exceeds allowance': '⛽ Gas limit too low. Try increasing gas.',
  'execution reverted': '❌ Transaction reverted. Check your bet amount.',
};

/**
 * Enhanced error handler that extracts meaningful messages from blockchain errors
 */
export const errorHandler = (error: unknown): string => {
  const serialized = serializeError(error);

  // Extract error message
  let errorMessage = serialized.message ?? 'An unknown error occurred';

  // Check if it's a viem/wagmi contract error
  if (serialized.cause && typeof serialized.cause === 'object') {
    const cause = serialized.cause as Record<string, unknown>;

    // Extract contract revert reason
    if (typeof cause.reason === 'string') {
      errorMessage = cause.reason;
    } else if (typeof cause.shortMessage === 'string') {
      errorMessage = cause.shortMessage;
    } else if (typeof cause.message === 'string') {
      errorMessage = cause.message;
    }
  }

  // Try to find contract error name in the message
  for (const [errorName, friendlyMessage] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (errorMessage.includes(errorName)) {
      return friendlyMessage;
    }
  }

  // Check for common error patterns
  const lowerMessage = errorMessage.toLowerCase();
  for (const [pattern, friendlyMessage] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // If no match found, clean up the technical message
  // Remove technical prefixes
  errorMessage = errorMessage
    .replace(/^Error:\s*/i, '')
    .replace(/^execution reverted:\s*/i, '')
    .replace(/^VM Exception while processing transaction:\s*/i, '')
    .replace(/revert\s*/i, '')
    .trim();

  // If message is too technical or empty, provide generic helpful message
  if (!errorMessage || errorMessage.length < 3 || errorMessage.includes('0x')) {
    return '❌ Transaction failed. Please check your bet amount and wallet balance.';
  }

  return errorMessage;
};

/**
 * Get suggested action based on error type
 */
export const getErrorAction = (errorMessage: string): string | null => {
  if (errorMessage.includes('bet is too low')) {
    return 'Check the current highest bet and increase your amount.';
  }
  if (errorMessage.includes('Not your turn')) {
    return 'Wait for other players to complete their actions.';
  }
  if (errorMessage.includes('Insufficient funds')) {
    return 'Add more ETH to your wallet before continuing.';
  }
  if (errorMessage.includes('shuffle first')) {
    return 'Wait for all players to complete shuffling.';
  }
  if (errorMessage.includes('timeout hasn\'t expired')) {
    return 'Wait for the 2-minute timeout period to complete.';
  }
  if (errorMessage.includes('cancelled')) {
    return 'You rejected the transaction. Try again when ready.';
  }
  return null;
};
