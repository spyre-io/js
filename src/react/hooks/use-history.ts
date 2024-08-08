import {HistorySearchCriteria} from "@/core/history/types";
import {useClient} from "./use-client";
import {useQuery} from "@tanstack/react-query";

/**
 * Returns a Tanstack [`useQuery`](https://tanstack.com/query/latest/docs/framework/react/guides/queries) object for fetching a user's game history, given the {@link HistorySearchCriteria}.
 *
 * ```ts
 * const { isPending, data: matches } = useHistoryFind();
 * ```
 *
 * @param criteria (optional) - The search criteria to filter the history.
 * @param cursor (optional) - The cursor for pagination.
 * @param count (optional) - The number of items to return.
 */
export const useHistoryFind = (
  criteria?: HistorySearchCriteria,
  cursor?: string,
  count?: number,
) => {
  const history = useClient().history;

  return useQuery({
    queryKey: ["history", "find", criteria, cursor, count],
    queryFn: async () => await history.find(criteria, cursor, count),
  });
};

/**
 * Returns a Tanstack [`useQuery`](https://tanstack.com/query/latest/docs/framework/react/guides/queries) object for fetching a specific match by its ID.
 *
 * ```ts
 * const { isPending, data: match } = useHistoryGet("1234");
 * ```
 *
 * @param matchId - The ID of the match.
 */
export const useHistoryGet = (matchId: string) => {
  const history = useClient().history;

  return useQuery({
    queryKey: ["history", "get", matchId],
    queryFn: async () => await history.get(matchId),
  });
};
