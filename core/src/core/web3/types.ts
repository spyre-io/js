export type Web3Address = `0x${string}`;

export type Web3ConnectionStatus = "connected" | "disconnected" | "connecting";

export type Web3Config = {
  providerType: string;
  providerConfig: any;
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

export class SigningError extends Error {
  constructor(
    public readonly type: SigningErrorType,
    message: string = "Could not sign data.",
  ) {
    super(message);
  }
}

export enum TxnStatus {
  NotStarted = "not-started",
  Sent = "sent",
  WaitingForConfirmation = "waiting-for-confirmation",
  Confirmed = "success",
  Failed = "failure",
}

export class Txn {
  private _status: TxnStatus = TxnStatus.NotStarted;
  private _hash: string = "";
  private _error: string = "";

  constructor(
    public readonly id: number,
    // todo: this is obviously not right
    public readonly ns: string,
  ) {
    this._status = TxnStatus.Sent;
  }

  get status(): TxnStatus {
    return this._status;
  }

  get hash(): string {
    return this._hash;
  }

  get error(): string {
    return this._error;
  }

  get isConfirmed(): boolean {
    return this._status === TxnStatus.Confirmed;
  }

  sent(): void {
    this._status = TxnStatus.Sent;
  }

  waiting(): void {
    this._status = TxnStatus.WaitingForConfirmation;
  }

  confirm(hash: string): void {
    this._status = TxnStatus.Confirmed;
    this._hash = hash;
  }

  fail(error: string): void {
    this._status = TxnStatus.Failed;
    this._error = error;
  }

  onResolve(cb: () => void) {
    // TODO
  }
}
