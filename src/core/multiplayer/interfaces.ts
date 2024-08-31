import {BracketDefinition} from "./types.gen";
import {MatchInfo, MatchmakingInfo} from "@/core/shared/types.gen";
import {Kv, WatchedValue} from "@/core/shared/types";
import {Match} from "@heroiclabs/nakama-js";
import {
  DisconnectReason,
  MatchEndEvent,
  MatchmakingAcceptSignals,
  MatchStartEvent,
  MatchUserState,
} from "./types";

export interface IMultiplayerService {
  get brackets(): BracketDefinition[];

  get matchmakingInfo(): WatchedValue<MatchmakingInfo | null>;
  get matchJoinIds(): WatchedValue<string[]>;
  get matchInfo(): WatchedValue<MatchInfo | null>;
  get match(): WatchedValue<Match | null>;

  refreshBrackets(): Promise<void>;

  findMatches(bracketId: number): Promise<void>;
  acceptAndJoin(
    factory: IMatchHandlerFactory,
    signals?: MatchmakingAcceptSignals,
  ): Promise<void>;

  rejoin(
    matchId: string,
    meta: Kv<string>,
    factory: IMatchHandlerFactory,
    signals: MatchmakingAcceptSignals,
    retries?: number,
  ): Promise<void>;
  leave(): Promise<void>;
  send(
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void>;
}

export interface IMatchHandlerFactory {
  instance(): IMatchHandler;
}

export interface IMatchHandler {
  joined(context: IMatchContext): void;
  presenceJoined(context: IMatchContext, user: MatchUserState): void;
  presenceLeft(context: IMatchContext, user: MatchUserState): void;
  matchStarted(context: IMatchContext, evt: MatchStartEvent): void;
  matchEnded(context: IMatchContext, evt: MatchEndEvent): void;
  disconnect(reason: DisconnectReason): void;
}

export interface IMatchContext {
  get matchId(): string;

  addHandler(
    opCode: number,
    handler: (payload: Uint8Array) => void,
  ): () => void;
  onMatchData(opCode: number, payload: Uint8Array): void;

  send(opCode: number, payload: any): void;
  quit(): void;
}
