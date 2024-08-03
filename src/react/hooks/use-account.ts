import {useClient} from "./use-client";

export const useAccount = () => {
  const client = useClient();

  return client.account.user;
};

export const useAccountBalances = () => {
  const client = useClient();

  return client.account.balances;
};

export const useAccountWalletAddress = () => {
  const client = useClient();

  return client.account.user?.walletAddr;
};
