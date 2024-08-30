import {
  BracketDefinition,
  GetBracketsResponse,
  MatchmakingAcceptResponse,
  MatchmakingResponse,
} from "./types.gen";
import {MatchInfo, MatchmakingInfo} from "@/core/shared/types.gen";
import {logger} from "@/core/util/logger";
import {Kv, WatchedValue} from "@/core/shared/types";
import {Match} from "@heroiclabs/nakama-js";
import {IConnectionService, IRpcService} from "@/core/net/interfaces";
import {IAccountService} from "@/core/account/service";
import {IWeb3Service} from "@/core/web3/service";
import {MatchmakingAcceptSignals, MatchmakingBracketInfo} from "./types";
import {IMatchHandler, IMatchHandlerFactory, NullMatchHandler} from "./handler";
import {IMatchContext, MatchContext, NullMatchContext} from "./context";
import {ClockService, IClockService} from "../clock/service";
import {Signature} from "../web3/types";

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

const getMatchmakingBracketInfo = (
  info: MatchmakingInfo,
): MatchmakingBracketInfo => {
  const {nonce, expiry, amount, fee} = info;

  return {
    nonce,
    expiry: parseInt(expiry),
    amount: parseInt(amount),
    fee: parseInt(fee),
  };
};

export class MultiplayerService implements IMultiplayerService {
  match: WatchedValue<Match | null> = new WatchedValue<Match | null>(null);
  matchInfo: WatchedValue<MatchInfo | null> =
    new WatchedValue<MatchInfo | null>(null);
  matchmakingInfo: WatchedValue<MatchmakingInfo | null> =
    new WatchedValue<MatchmakingInfo | null>(null);
  matchJoinIds: WatchedValue<string[]> = new WatchedValue<string[]>([]);

  private _context: IMatchContext = new NullMatchContext();
  private _handler: IMatchHandler = new NullMatchHandler();
  private _brackets: BracketDefinition[] = [];

  private clock: ClockService | null = null;

  constructor(
    private readonly rpc: IRpcService,
    private readonly account: IAccountService,
    private readonly web3: IWeb3Service,
    private readonly connection: IConnectionService,
  ) {
    //
  }

  get brackets(): BracketDefinition[] {
    return this._brackets;
  }

  init(clock: ClockService) {
    this.clock = clock;
  }

  async refreshBrackets(): Promise<void> {
    const res = await this.rpc.call<GetBracketsResponse>(
      "matchmaking/get-brackets",
      {game: "hangman"},
    );

    this._brackets = res.brackets.sort((a, b) => a.id - b.id);
  }

  async findMatches(bracketId: number): Promise<void> {
    this.matchmakingInfo.setValue(null);
    this.matchJoinIds.setValue([]);
    this.matchInfo.setValue(null);
    this.match.setValue(null);

    const res = await this.rpc.call<MatchmakingResponse>(
      "hangman/matchmaking/find",
      {bracketId},
    );
    if (!res.success) {
      throw new Error("Failed to find matches");
    }

    const {matchmakingInfo, matchInfo} = res;

    // we might already be in a match
    const {creatorMatchId, opponentMatchIds} = matchInfo;

    const ids = [];
    if (creatorMatchId && creatorMatchId.length > 0) {
      ids.push(creatorMatchId);
    }

    if (opponentMatchIds && opponentMatchIds.length > 0) {
      ids.push(...opponentMatchIds);
    }
    this.matchJoinIds.setValue(ids);
    this.matchmakingInfo.setValue(matchmakingInfo);
    this.matchInfo.setValue(matchInfo);
  }

  async acceptAndJoin(
    factory: IMatchHandlerFactory,
    signals: MatchmakingAcceptSignals = {},
  ): Promise<void> {
    const {onSignStart, onSignComplete, onAcceptStart, onAcceptComplete} =
      signals;

    const matchmakingInfo = this.matchmakingInfo.getValue();
    if (!matchmakingInfo) {
      throw new Error("No matchmaking info");
    }

    let sig: Signature | undefined = undefined;
    if (matchmakingInfo.onChain) {
      const {nonce, expiry, amount, fee} =
        getMatchmakingBracketInfo(matchmakingInfo);

      // first, sign the stake
      if (onSignStart) {
        onSignStart();
      }
      sig = await this.web3.signStake({
        nonce,
        expiry,
        amount,
        fee,
      });
      if (onSignComplete) {
        onSignComplete(sig);
      }
    }

    // submit to backend
    if (onAcceptStart) {
      onAcceptStart();
    }
    const res = await this.rpc.call<MatchmakingAcceptResponse>(
      "hangman/matchmaking/accept",
      {
        mmId: matchmakingInfo.mmId,
        signature: sig,
      },
    );

    if (!res.success) {
      throw new Error("Failed to accept match");
    }

    if (onAcceptComplete) {
      onAcceptComplete();
    }

    // iterate through match join ids and try to join one
    this.matchJoinIds.setValue(res.matchJoinIds);
    for (const id of res.matchJoinIds) {
      try {
        await this.rejoin(id, {mmId: matchmakingInfo.mmId}, factory, signals);

        break;
      } catch (error) {
        logger.info("Couldn't join match @MatchId: " + error, id);
      }
    }

    if (!this.match.getValue()) {
      throw new Error("Failed to join match");
    }
  }

  rejoin = async (
    matchId: string,
    meta: Kv<string>,
    factory: IMatchHandlerFactory,
    {onJoinStart, onJoinComplete}: MatchmakingAcceptSignals = {},
    retries: number = 3,
  ): Promise<void> => {
    if (onJoinStart) {
      onJoinStart();
    }

    this._handler = factory.instance();
    const match = await this.connection.join(
      matchId,
      meta,
      retries,
      this._handleMessages,
    );

    this.match.setValue(match);

    if (onJoinComplete) {
      onJoinComplete();
    }

    this._context = new MatchContext(this.connection, this.clock!, match);
    this._handler.joined(this._context);
  };

  _handleMessages = (opCode: number, payload: Uint8Array): void => {
    this._context.onMatchData(opCode, payload);
  };

  leave(): Promise<void> {
    return this.connection.leave();
  }

  send(
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void> {
    const match = this.match.getValue();
    if (!match) {
      throw new Error("No match");
    }

    return this.connection.sendMatchState(
      match.match_id,
      opCode,
      payload,
      retries,
    );
  }
}
