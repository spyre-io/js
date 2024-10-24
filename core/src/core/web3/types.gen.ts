/////////////////////////////////////////////////////////////////////// core

export type ChainChompTxn = {
  id: number;
  createdAt: number;
  updatedAt: number;
  method: string;
  status: string;
  txnHash: string;
  error: string;
};

/////////////////////////////////////////////////////////////////////// network

export type GetTxnRpcResponse = {
  success: boolean;
  error: string;
  txn: ChainChompTxn;
};

export type GetNonceResponse = {
  nonce: string;
  success: boolean;
  error: string;
};

export type PermitResponse = {
  success: boolean;
  error: string;
  txnId: number;
};

export type DepositResponse = {
  success: boolean;
  error: string;
  txnId: number;
};

export type GetLinkChallengeResponse = {
  initRequestId: string;
  payload: string;
  success: boolean;
  error: string;
};

export type AuthWalletVerifyResponse = {
  success: boolean;
  error: string;
  linked: boolean;
  addr: `0x${string}`;
};
