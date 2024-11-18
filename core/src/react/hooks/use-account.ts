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
 */
export const useAccountUpdate = () => {
  const client = useClient();
  const queryClient = useQueryClient();

  const query = useCallback(
    async (user: User) => {
      await client.account.update(user);
      await queryClient.invalidateQueries({queryKey: ["account"]});
    },
    [client],
  );

  return useMutation({
    mutationFn: query,
  });
};

/**
 * Returns a Tanstack [`useMutation`](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) object for updating the current user's username.
 *
 */
export const useAccountUpdateUsername = () => {
  const client = useClient();
  const queryClient = useQueryClient();

  const query = useCallback(
    async (username: string) => {
      const current = client.account.user;

      await client.account.update({...current, username});
      await queryClient.invalidateQueries({queryKey: ["account"]});
    },
    [client],
  );

  return useMutation({
    mutationFn: query,
  });
};

export const useAccountSoftBalance = (currencyName: string) => {
  const {data} = useAccount();

  return useQuery({
    queryKey: ["account", "soft-balance", currencyName],
    queryFn: async () => {
      const value = data?.balances[currencyName] ?? 0;
      return Number(value);
    },
    enabled: !!data,
  });
};
