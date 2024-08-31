import {IRpcService} from "@/core/net/interfaces";
import {SpyreErrorCode} from "@/core/shared/errors";
import {SpyreError} from "@/core/shared/types";
import {IHistoryService} from "./interfaces";
import {HistorySearchCriteria} from "./types";
import {
  GetHistoryListResponse,
  GetHistoryMatchResponse,
  HistoryItem,
  HistorySummaryItem,
} from "./types.gen";

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
