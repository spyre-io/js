import {Signature} from "../web3/types";
import {MatchmakingAcceptResponse, MatchmakingResponse} from "./types.gen";
import {MatchInfo, MatchmakingInfo} from "../shared/types.gen";
import {logger} from "../util/logger";
import {Kv} from "../shared/types";
import {Match} from "@heroiclabs/nakama-js";
import {IConnectionService, IRpcService} from "../net/service";
import {IAccountService} from "../account/service";
import {IWeb3Service} from "../web3/service";
import {MatchmakingBracketInfo} from "./types";
import {IMatchHandler, IMatchHandlerFactory, NullMatchHandler} from "./handler";
import {IMatchContext, MatchContext, NullMatchContext} from "./context";

export type MatchmakingAcceptSignals = {
  onSignStart?: () => void;
  onSignComplete?: (signature: Signature) => void;

  onAcceptStart?: () => void;
  onAcceptComplete?: () => void;

  onJoinStart?: () => void;
  onJoinComplete?: () => void;
};

export interface IMultiplayerService {
  findMatches(bracketId: number): Promise<void>;
  accept(
    bracket: MatchmakingBracketInfo,
    factory: IMatchHandlerFactory,
    signals: MatchmakingAcceptSignals,
  ): Promise<void>;

  join(matchId: string, meta: Kv<string>, retries: number): Promise<Match>;
  leave(): Promise<void>;
  send(
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void>;
}

export class MultiplayerService implements IMultiplayerService {
  rpc: IRpcService;
  account: IAccountService;
  web3: IWeb3Service;
  connection: IConnectionService;

  match: Match | null = null;
  matchInfo: MatchInfo | null = null;
  matchmakingInfo: MatchmakingInfo | null = null;
  matchJoinIds: string[] = [];
  mmId: string = "";

  context: IMatchContext = new NullMatchContext();
  handler: IMatchHandler = new NullMatchHandler();

  constructor(
    rpc: IRpcService,
    account: IAccountService,
    web3: IWeb3Service,
    connection: IConnectionService,
  ) {
    this.rpc = rpc;
    this.account = account;
    this.web3 = web3;
    this.connection = connection;
  }

  join = async (
    matchId: string,
    meta: Kv<string>,
    retries: number = 3,
  ): Promise<Match> => {
    return this.connection.join(matchId, meta, retries);
  };

  leave(): Promise<void> {
    return this.connection.leave();
  }

  send(
    opCode: number,
    payload: string | Uint8Array,
    retries?: number,
  ): Promise<void> {
    if (!this.match) {
      throw new Error("No match");
    }

    return this.connection.sendMatchState(
      this.match.match_id,
      opCode,
      payload,
      retries,
    );
  }

  async findMatches(bracketId: number): Promise<void> {
    this.match = null;
    this.matchmakingInfo = null;
    this.matchJoinIds = [];
    this.matchInfo = null;

    const res = await this.rpc.call<MatchmakingResponse>(
      "hangman/matchmaking/find",
      {bracketId},
    );
    if (!res.payload.success) {
      throw new Error("Failed to find matches");
    }

    const {matchmakingInfo, matchInfo} = res.payload;

    // we might already be in a match
    const {creatorMatchId, opponentMatchIds} = matchInfo;
    this.matchJoinIds = [];
    if (creatorMatchId && creatorMatchId.length > 0) {
      this.matchJoinIds.push(creatorMatchId);
    }

    if (opponentMatchIds && opponentMatchIds.length > 0) {
      this.matchJoinIds.push(...opponentMatchIds);
    }

    this.matchmakingInfo = matchmakingInfo;
  }

  async accept(
    {nonce, expiry, amount, fee}: MatchmakingBracketInfo,
    factory: IMatchHandlerFactory,
    {
      onSignStart,
      onSignComplete,
      onAcceptStart,
      onAcceptComplete,
      onJoinStart,
      onJoinComplete,
    }: MatchmakingAcceptSignals = {},
  ): Promise<void> {
    if (!this.matchmakingInfo) {
      throw new Error("No matchmaking info");
    }

    // first, sign the stake
    if (onSignStart) {
      onSignStart();
    }
    const sig = await this.web3.signStake({
      nonce,
      expiry,
      amount,
      fee,
    });
    if (onSignComplete) {
      onSignComplete(sig);
    }

    // submit to backend
    if (onAcceptStart) {
      onAcceptStart();
    }
    const res = await this.rpc.call<MatchmakingAcceptResponse>(
      "hangman/matchmaking/accept",
      {
        mmId: this.matchmakingInfo.mmId,
        signature: sig,
      },
    );

    if (!res.payload.success) {
      throw new Error("Failed to accept match");
    }

    if (onAcceptComplete) {
      onAcceptComplete();
    }

    this.matchJoinIds = res.payload.matchJoinIds;

    // iterate through match join ids and try to join one
    if (onJoinStart) {
      onJoinStart();
    }

    let match: Match | null = null;
    for (const id of this.matchJoinIds) {
      try {
        match = await this.join(id, {mmId: this.matchmakingInfo.mmId});

        break;
      } catch (error) {
        logger.info("Couldn't join match @MatchId: " + error, id);
      }
    }

    if (!match) {
      throw new Error("Failed to join match");
    }

    if (onJoinComplete) {
      onJoinComplete();
    }

    this.context = new MatchContext(this.connection, match);

    this.handler = factory.instance(match.match_id);
    this.handler.joined(this.context);
  }
}
