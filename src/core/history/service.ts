import {IRpcService} from "../net/interfaces";
import {SpyreErrorCode} from "../shared/errors";
import {SpyreError} from "../shared/types";
import {HistorySearchCriteria} from "./types";
import {
  GetHistoryListResponse,
  GetHistoryMatchResponse,
  HistoryItem,
  HistorySummaryItem,
} from "./types.gen";

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
  ): Promise<[string, HistorySummaryItem[]]>;

  /**
   * Retrieves a specific match by its ID.
   *
   * @param matchId ID of the match.
   *
   * @returns The match.
   */
  get(matchId: string): Promise<HistoryItem>;
}

export class HistoryService implements IHistoryService {
  constructor(private readonly _rpc: IRpcService) {
    //
  }

  async find(
    criteria?: HistorySearchCriteria,
    cursor?: string,
    count?: number,
  ): Promise<[string, HistorySummaryItem[]]> {
    const response = await this._rpc.call<GetHistoryListResponse>(
      "hangman/history/list",
      {cursor, count, ...criteria},
    );

    if (!response.success) {
      throw new SpyreError(SpyreErrorCode.INTERNAL, response.error);
    }

    return [response.nextCursor, response.matches];
  }

  async get(matchId: string): Promise<HistoryItem> {
    const response = await this._rpc.call<GetHistoryMatchResponse>(
      "hangman/history/match",
      {
        matchId,
      },
    );

    if (!response.success) {
      throw new SpyreError(SpyreErrorCode.INTERNAL, response.error);
    }

    return response.match;
  }
}
