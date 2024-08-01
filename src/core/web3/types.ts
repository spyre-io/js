export type Web3Config = {
  name: string;
  chainId: number;
  contracts: {[name: string]: ContractConfig};
  blockExplorer: "https://basescan.org";
};

export type ContractConfig = {
  addr: `0x${string}`;
  abi: any;
};

export type Signature = {
  r: string;
  s: string;
  v: string;
};

export type SignStakeParameters = {
  nonce: string;
  expiry: number;
  amount: number;
  fee: number;
};

export enum SigningErrorType {
  UNKNOWN = 0,
  USER_CANCELED = 4001,
  WRONG_CHAIN = -32603,
}

export class SigniningError extends Error {
  constructor(
    public readonly type: SigningErrorType,
    message: string = "Could not sign data.",
  ) {
    super(message);
  }
}
