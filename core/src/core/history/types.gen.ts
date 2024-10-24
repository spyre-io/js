export type HistorySummaryItem = {
  schemaVersion: string;
  matchId: string;
};

export type HistoryItem = {
  schemaVersion: string;
  matchId: string;
};

export type GetHistoryListResponse = {
  success: boolean;
  error: string;
  matches: HistorySummaryItem[];
  nextCursor: string;
};

export type GetHistoryMatchResponse = {
  success: boolean;
  error: string;
  match: HistoryItem;
};
