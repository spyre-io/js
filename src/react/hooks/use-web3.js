import {
  useActiveAccount,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";
import {useAccountWalletAddress} from "./use-account";
import {useClient} from "./use-client";
import {useCallback, useSyncExternalStore} from "react";

export const useWeb3ConnectionStatus = () => useActiveWalletConnectionStatus();

export const useWeb3IsWalletConnected = () => {
  const status = useActiveWalletConnectionStatus();

  return status === "connected";
};

export const useWeb3IsWalletConnectedAndLinked = () => {
  const status = useActiveWalletConnectionStatus();
  const connectedAddress = useWeb3ActiveAddress();
  const accountAddress = useAccountWalletAddress();

  return (
    status === "connected" &&
    connectedAddress &&
    accountAddress &&
    connectedAddress === accountAddress
  );
};

export const useWeb3ActiveAddress = () => {
  const address = useClient().web3.activeAddress;

  return useSyncExternalStore(address.watch, address.getValue);
};

export const useWeb3LinkedAddress = () => {
  const address = useClient().web3.linkedAddress;

  return useSyncExternalStore(address.watch, address.getValue);
};

export const useWeb3StakingBalance = () => {
  const balance = useClient().web3.stakingBalance;

  return useSyncExternalStore(balance.value.watch, balance.value.getValue);
};

export const useWeb3StakingBalanceFetch = () => {
  const balance = useClient().web3.stakingBalance;

  return useSyncExternalStore(balance.fetch.watch, balance.fetch.getValue);
};

export const useWeb3UsdcBalance = () => {
  const balance = useClient().web3.usdcBalance;

  return useSyncExternalStore(balance.value.watch, balance.value.getValue);
};

export const useWeb3UsdcBalanceFetch = () => {
  const balance = useClient().web3.usdcBalance;

  return useSyncExternalStore(balance.fetch.watch, balance.fetch.getValue);
};

export const useWeb3RefreshBalances = () => {
  const web3 = useClient().web3;

  return useCallback(
    async () =>
      await Promise.all([
        web3.stakingBalance.refresh(),
        web3.usdcBalance.refresh(),
      ]),
    [web3.stakingBalance, web3.usdcBalance],
  );
};

export const useWeb3NeedsSwitchChain = () => {
  const web3 = useClient().web3;

  return useSyncExternalStore(
    web3.needsToSwitchChains.watch,
    web3.needsToSwitchChains.getValue,
  );
};

export const useWeb3SwitchChain = () => {
  const web3 = useClient().web3;

  return web3.switchChain;
};
