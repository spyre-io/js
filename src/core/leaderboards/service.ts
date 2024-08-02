export class LeaderboardEntry {}

export interface ILeaderboardService {
  list(name: string, count: number): Promise<LeaderboardEntry[]>;
}

export class LeaderboardService implements ILeaderboardService {
  async list(name: string, count: number): Promise<LeaderboardEntry[]> {
    return [];
  }
}
