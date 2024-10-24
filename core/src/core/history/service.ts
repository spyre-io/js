import {IRpcService} from "@/core/net/interfaces";
import {SpyreErrorCode} from "@/core/shared/errors";
import {SpyreError} from "@/core/shared/types";
import {HistorySearchResults, IHistoryService} from "./interfaces";
import {HistorySearchCriteria} from "./types";
import {
  GetHistoryListResponse,
  GetHistoryMatchResponse,
  HistoryItem,
} from "./types.gen";

export class HistoryService implements IHistoryService {
  constructor(private readonly _rpc: IRpcService) {
    //
  }

  async find(
    criteria?: HistorySearchCriteria,
    cursor?: string,
    count?: number,
  ): Promise<HistorySearchResults> {
    const response = await this._rpc.call<GetHistoryListResponse>(
      "hangman/history/list",
      {cursor, count, ...criteria},
    );

    if (!response.success) {
      throw new SpyreError(SpyreErrorCode.INTERNAL, response.error);
    }

    return {
      cursor: response.nextCursor,
      matches: response.matches,
    };
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
