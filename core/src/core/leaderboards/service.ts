import {IRpcService} from "../net/interfaces";
import {childLogger} from "../util/logger";
import {ILeaderboardService} from "./interfaces";
import {
  GetLbResponse,
  GetLbWinnersResponse,
  LbListResponse,
  LbWinnersResponse,
  LeaderboardInterval,
} from "./types";

const logger = childLogger("core:leaderboard");

export class LeaderboardService implements ILeaderboardService {
  constructor(private readonly _rpc: IRpcService) {
    //
  }

  async list(
    ns: string,
    interval: LeaderboardInterval,
  ): Promise<LbListResponse> {
    logger.debug("LeaderboardService.list(@Ns, @Interval)", ns, interval);

    const res = await this._rpc.call<GetLbResponse>("leaderboard/get", {
      ns,
      interval,
    });
    if (!res.success) {
      throw new Error(res.error);
    }

    return {
      records: res.records,
      nextRewards: res.nextRewards,
    };
  }

  async winners(
    ns: string,
    interval: LeaderboardInterval,
  ): Promise<LbWinnersResponse> {
    logger.debug("LeaderboardService.winners(@Ns, @Interval)", ns, interval);

    const res = await this._rpc.call<GetLbWinnersResponse>(
      "leaderboard/winners",
      {
        ns,
        interval,
      },
    );
    if (!res.success) {
      throw new Error(res.error);
    }

    return {
      records: res.records,
    };
  }
}
