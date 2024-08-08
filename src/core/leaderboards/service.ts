import {logger} from "@/core/util/logger";
import {LeaderboardEntry} from "./types";

export interface ILeaderboardService {
  list(name: string, count: number): Promise<LeaderboardEntry[]>;
}

export class LeaderboardService implements ILeaderboardService {
  async list(name: string, count: number): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.list(@name, @count)", {name, count});
    return [];
  }
}
