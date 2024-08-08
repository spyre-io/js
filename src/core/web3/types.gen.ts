/////////////////////////////////////////////////////////////////////// network

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
