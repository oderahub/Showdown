export interface OverlayProps {
  contractAddress: `0x${string}`;
  refresh?: () => Promise<void>;
}

export interface Player {
  addr: string;
  publicKey: {
    x: bigint;
    y: bigint;
  };
}
