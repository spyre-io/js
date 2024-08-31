import {LeaderboardEntry} from "./types";

export interface ILeaderboardService {
  list(name: string, count: number): Promise<LeaderboardEntry[]>;
}
