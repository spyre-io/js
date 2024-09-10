import {
  BracketDefinition,
  GetBracketsResponse,
  MatchmakingAcceptResponse,
  MatchmakingResponse,
} from "./types.gen";
import {MatchmakingInfo} from "@/core/shared/types.gen";
import {Kv, WatchedValue} from "@/core/shared/types";
import {Match} from "@heroiclabs/nakama-js";
import {
  IConnectionService,
  IMatchDataHandler,
  IRpcService,
} from "@/core/net/interfaces";
import {IWeb3Service} from "@/core/web3/interfaces";
import {MatchmakingAcceptSignals} from "./types";
import {MatchContext} from "./context";
import {ClockService} from "@/core/clock/service";
import {Signature} from "@/core/web3/types";
import {
  IMatchContext,
  IMatchHandler,
  IMatchHandlerFactory,
  IMultiplayerService,
} from "./interfaces";
import {getMatchmakingBracketInfo} from "./util";
import {childLogger} from "@/core/util/logger";

const logger = childLogger("becky:multiplayer");

export class MultiplayerService
  implements IMultiplayerService, IMatchDataHandler
{
  match: WatchedValue<Match | null> = new WatchedValue<Match | null>(null);
  matchmakingInfo: WatchedValue<MatchmakingInfo | null> =
    new WatchedValue<MatchmakingInfo | null>(null);
  matchJoinIds: WatchedValue<string[]> = new WatchedValue<string[]>([]);

  private _context: IMatchContext | null = null;
  private _handler: IMatchHandler | null = null;
  private _brackets: BracketDefinition[] = [];
  private _dataQueue: {opCode: number; data: Uint8Array}[] = [];

  private clock: ClockService | null = null;

  constructor(
    private readonly rpc: IRpcService,
    private readonly web3: IWeb3Service,
    private readonly connection: IConnectionService,
  ) {
    //
  }

  get brackets(): BracketDefinition[] {
    return this._brackets;
  }

  init = (clock: ClockService) => {
    this.clock = clock;
  };

  onData = (opCode: number, data: Uint8Array): void => {
    if (this._context) {
      this._context.onMatchData(opCode, data);
    } else {
      this._dataQueue.push({opCode, data});
    }
  };

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
    this.match.setValue(null);

    const res = await this.rpc.call<MatchmakingResponse>(
      "hangman/matchmaking/find",
      {bracketId},
    );
    if (!res.success) {
      throw new Error("Failed to find matches");
    }

    const {matchmakingInfo, matchInfo} = res;

    // we might already be in a match!
    if (matchInfo) {
      const {creatorMatchId, opponentMatchIds} = matchInfo;

      const ids = [];
      if (creatorMatchId && creatorMatchId.length > 0) {
        ids.push(creatorMatchId);
      }

      if (opponentMatchIds && opponentMatchIds.length > 0) {
        ids.push(...opponentMatchIds);
      }

      this.matchJoinIds.setValue(ids);
    }

    this.matchmakingInfo.setValue(matchmakingInfo);
  }

  async acceptAndJoin(
    factory: IMatchHandlerFactory,
    signals: MatchmakingAcceptSignals = {},
  ): Promise<void> {
    const {
      onSignStart,
      onSignComplete,
      onSignError,
      onAcceptStart,
      onAcceptComplete,
      onAcceptError,
      onJoinError,
    } = signals;

    const matchmakingInfo = this.matchmakingInfo.getValue();
    if (!matchmakingInfo) {
      throw new Error("No matchmaking info");
    }

    // if we do not have any match join ids, we need to accept
    let matchJoinIds = this.matchJoinIds.getValue();

    logger.info("Accept and join, ids: @MatchJoinIds", matchJoinIds.join(", "));

    if (matchJoinIds.length === 0) {
      let sig: Signature | undefined = undefined;
      if (matchmakingInfo.onChain) {
        const {nonce, expiry, amount, fee} =
          getMatchmakingBracketInfo(matchmakingInfo);

        // first, sign the stake
        if (onSignStart) {
          onSignStart();
        }
        try {
          sig = await this.web3.signStake({
            nonce,
            expiry,
            amount,
            fee,
          });
        } catch (error) {
          if (onSignError) {
            onSignError(error as Error);
          }

          throw error;
        }

        if (onSignComplete) {
          onSignComplete(sig);
        }
      }

      // submit to backend
      if (onAcceptStart) {
        onAcceptStart();
      }

      let res;
      try {
        res = await this.rpc.call<MatchmakingAcceptResponse>(
          "hangman/matchmaking/accept",
          {
            mmId: matchmakingInfo.mmId,
            signature: sig,
          },
        );
      } catch (error) {
        if (onAcceptError) {
          onAcceptError(error as Error);
        }

        throw error;
      }

      if (!res.success) {
        if (onAcceptError) {
          onAcceptError(new Error(res.error));
        }

        throw new Error("Failed to accept match");
      }

      this.matchJoinIds.setValue(res.matchJoinIds);

      if (onAcceptComplete) {
        onAcceptComplete();
      }
    }

    // iterate through match join ids and try to join one
    matchJoinIds = this.matchJoinIds.getValue();
    for (const id of matchJoinIds) {
      try {
        await this.rejoin(id, {mmId: matchmakingInfo.mmId}, factory, signals);

        break;
      } catch (error) {
        logger.info("Couldn't join match @MatchId: " + error, id);
      }
    }

    if (!this.match.getValue()) {
      if (onJoinError) {
        onJoinError(new Error("Failed to join match"));
      }

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
    const match = await this.connection.join(matchId, meta, retries);

    this.match.setValue(match);

    if (onJoinComplete) {
      onJoinComplete();
    }

    this._context = new MatchContext(this.connection, this.clock!, match);
    this._handler.joined(this._context);

    // process any queued data
    const queue = this._dataQueue.concat();
    this._dataQueue.length = 0;
    for (const {opCode, data} of queue) {
      this._context.onMatchData(opCode, data);
    }
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
