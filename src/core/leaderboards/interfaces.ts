import {LeaderboardEntry} from "./types";

export interface ILeaderboardService {
  list(name: string, count: number): Promise<LeaderboardEntry[]>;

  daily(tag: string, count: number): Promise<LeaderboardEntry[]>;
  weekly(tag: string, count: number): Promise<LeaderboardEntry[]>;
  all(tag: string, count: number): Promise<LeaderboardEntry[]>;
}
