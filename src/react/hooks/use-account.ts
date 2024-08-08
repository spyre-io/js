import {useCallback} from "react";
import {useClient} from "./use-client";
import {User} from "@/core/account/types";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

/**
 * Returns a Tanstack [`useQuery`](https://tanstack.com/query/latest/docs/framework/react/guides/queries) object for fetching the current user's {@link User | Account}.
 *
 * ```
 * const { isPending, data: user } = useAccount();
 * ```
 */
export const useAccount = () => {
  const account = useClient().account;

  const query = useCallback(async () => {
    await account.refresh();

    return account.user;
  }, [account]);

  return useQuery({
    queryKey: ["account"],
    queryFn: query,
  });
};

/**
 * Returns a Tanstack [`useMutation`](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) object for re-fetching the current user's {@link User | Account}.
 *
 * ```
 * const { isPending, data: user } = useAccount();
 * const { mutate } = useAccountRefresh();
 *
 * ...
 *
 * useEffect(() => {
 *  mutate();
 * }, [foo, bar]);
 *
 * ```
 */
export const useAccountRefresh = () => {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.invalidateQueries({queryKey: ["account"]}),
    [queryClient],
  );
};

/**
 * Returns a Tanstack [`useMutation`](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) object for updating the current user's {@link User | Account} information.
 *
 * @param user - The {@link User | Account} object to update.
 */
export const useAccountUpdate = (user: User) => {
  const client = useClient();

  const query = useCallback(
    async () => await client.account.update(user),
    [client, user],
  );

  return useMutation({
    mutationFn: query,
  });
};
