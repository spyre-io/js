import {HistorySearchCriteria} from "./types";
import {HistoryItem, HistorySummaryItem} from "./types.gen";

/**
 * Service for interacting with the history of matches.
 */
export interface IHistoryService {
  /**
   * Retrieves a list of matches with the given search criteria.
   *
   * @param criteria Search criteria.
   * @param cursor Cursor for pagination. If not provided, starts from the beginning.
   * @param count Number of items to return. If not provided, returns all items. Maxes out at 100.
   *
   * @returns A tuple of the next pagination cursor and the list of matches.
   */
  find(
    criteria?: HistorySearchCriteria,
    cursor?: string,
    count?: number,
  ): Promise<HistorySearchResults>;

  /**
   * Retrieves a specific match by its ID.
   *
   * @param matchId ID of the match.
   *
   * @returns The match.
   */
  get(matchId: string): Promise<HistoryItem>;
}

export type HistorySearchResults = {
  cursor: string;
  matches: HistorySummaryItem[];
};
