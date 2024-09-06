import {INakamaClientService} from "../net/interfaces";
import {childLogger} from "../util/logger";
import {ILeaderboardService} from "./interfaces";
import {LeaderboardEntry} from "./types";

const logger = childLogger("becky:leaderboard");

export class LeaderboardService implements ILeaderboardService {
  constructor(private readonly _nakama: INakamaClientService) {
    //
  }

  async list(name: string, count: number): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.list(@Name, @Count)", name, count);

    return this._nakama.getApi(async (api, session) => {
      const response = await api.listLeaderboardRecords(
        session,
        name,
        undefined,
        count,
      );
      if (!response.records) {
        return [];
      }

      return response.records.map((record) => ({
        id: record.owner_id,
        username: record.username,
        score: record.score,
        rank: record.rank,
        updatedAt: record.update_time,
      }));
    }, 3);
  }

  async daily(tag: string, count: number = 100): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.daily(@Tag, @Count)", tag, count);

    return this.list(`leaderboard.${tag}.daily`, count);
  }

  async weekly(tag: string, count: number = 100): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.weekly(@Tag, @Count)", tag, count);

    return this.list(`leaderboard.${tag}.weekly`, count);
  }

  async all(tag: string, count: number = 100): Promise<LeaderboardEntry[]> {
    logger.debug("LeaderboardService.all(@Tag, @Count)", tag, count);

    return this.list(`leaderboard.${tag}.all-time`, count);
  }
}
