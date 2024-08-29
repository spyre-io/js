import {Signature} from "@/core/web3/types";

export const OpCodeInitClock = 1;
export const OpCodeInitNoop = 2;

export type MatchmakingAcceptSignals = {
  onSignStart?: () => void;
  onSignComplete?: (signature: Signature) => void;

  onAcceptStart?: () => void;
  onAcceptComplete?: () => void;

  onJoinStart?: () => void;
  onJoinComplete?: () => void;
};

export type MatchmakingBracketInfo = {
  nonce: string;
  expiry: number;
  amount: number;
  fee: number;
};

export class MatchUserState {
  constructor(public readonly userId: string) {
    //
  }
}

export class MatchStartEvent {
  constructor(public readonly startTime: number) {
    //
  }
}

export class MatchEndEvent {
  constructor(public readonly endTime: number) {
    //
  }
}

export enum DisconnectReason {
  MatchIsOver,
  UserRequested,
  Disposal,
  Exception,
}
