import {LbListResponse, LbWinnersResponse, LeaderboardInterval} from "./types";

export interface ILeaderboardService {
  list(ns: string, interval: LeaderboardInterval): Promise<LbListResponse>;
  winners(
    ns: string,
    interval: LeaderboardInterval,
  ): Promise<LbWinnersResponse>;
}
