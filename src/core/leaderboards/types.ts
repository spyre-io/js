export type LeaderboardInterval = "weekly" | "monthly" | "all-time" | string;

export type RewardDefinition = {
  id: number;
  type: string;
  value: number;
  meta: any;
};

export type LbRecord = {
  userId: string;
  username: string;
  score: number;
  subscore: number;
  numScore: number;
  metadata: string;
  rank: number;
  rewards: RewardDefinition[];
};

export type LbListResponse = {
  records: LbRecord[];
  nextRewards: RewardDefinition[][];
};

export type LbWinnersResponse = {
  records: LbRecord[];
};

export type GetLbResponse = {
  success: boolean;
  error: string;
  records: LbRecord[];
  nextRewards: RewardDefinition[][];
};

export type GetLbWinnersResponse = {
  success: boolean;
  error: string;
  records: LbRecord[];
};
