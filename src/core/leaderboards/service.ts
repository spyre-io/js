import {childLogger} from "../util/logger";
import {ILeaderboardService} from "./interfaces";
import {LeaderboardEntry} from "./types";

const logger = childLogger("becky:leaderboard");

export class LeaderboardService implements ILeaderboardService {
  async list(name: string, count: number): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.list(@name, @count)", {name, count});
    return [];
  }
}
