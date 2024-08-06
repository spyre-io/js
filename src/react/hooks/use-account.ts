import {useCallback, useSyncExternalStore} from "react";
import {useClient} from "./use-client";
import {User} from "core/account/service";

export const useAccount = () => {
  const user = useClient().account.user;

  return useSyncExternalStore(user.watch, user.getValue);
};

export const useAccountBalances = () => {
  const balances = useClient().account.balances;

  return useSyncExternalStore(balances.watch, balances.getValue);
};

export const useAccountCoins = () => {
  const balances = useAccountBalances();
  const coins = balances.coins;
  if (!coins) {
    return 0;
  }

  return Number(coins);
};

export const useAccountWalletAddress = () => {
  const user = useClient().account.user;
  const cb = useCallback(() => user.getValue()?.walletAddr, [user]);

  return useSyncExternalStore(user.watch, cb);
};

export const useAccountRefresh = () => {
  const client = useClient();

  return useCallback(() => client.account.refresh(), [client]);
};

export const useAccountUpdate = (user: User) => {
  const client = useClient();

  return useCallback(() => client.account.update(user), [client, user]);
};
