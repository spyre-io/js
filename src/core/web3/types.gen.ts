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
