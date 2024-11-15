import {useAccount} from "./use-account";
import {useClient} from "./use-client";
import {useCallback, useSyncExternalStore} from "react";
import {SignStakeParameters, Txn, Web3Address} from "@/core/web3/types";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {childLogger} from "@/core/util/logger";

const logger = childLogger("core:hooks:use-web3");

/**
 * Retrieves the current {@link Web3Config} object from the {@link IWeb3Service}.
 *
 * ```ts
 * const config = useWeb3Config();
 *
 * console.log("Current chain:", config.network.id);
 * ```
 */
export const useWeb3Config = () => {
  const web3 = useClient().web3;

  return web3.config;
};

export const useWeb3ConnectionStatus = () => {
  const web3 = useClient().web3;

  return useSyncExternalStore(
    web3.status.watch,
    web3.status.getValue,
    web3.status.getValue,
  );
};

export const useWeb3IsWalletConnected = () => {
  const status = useWeb3ConnectionStatus();

  return status === "connected";
};

export const useWeb3IsWalletConnectedAndLinked = () => {
  const status = useWeb3ConnectionStatus();
  const connectedAddress = useWeb3ActiveAddress();
  const {data: account} = useAccount();

  return (
    status === "connected" &&
    connectedAddress &&
    account &&
    connectedAddress === account.walletAddr
  );
};

export const useWeb3ActiveAddress = (): Web3Address | null => {
  const address = useClient().web3.activeAddress;

  return useSyncExternalStore(
    address.watch,
    address.getValue,
    address.getValue,
  );
};

export const useWeb3LinkedAddress = (): Web3Address | null => {
  const address = useClient().web3.linkedAddress;

  return useSyncExternalStore(
    address.watch,
    address.getValue,
    address.getValue,
  );
};

export const useWeb3StakingBalance = () => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const balance = web3.stakingBalance;

  const query = useCallback(async () => {
    await balance.refresh();

    return balance.value.getValue();
  }, [balance]);

  return useQuery({
    queryKey: ["balance", "staking", addr],
    queryFn: query,
  });
};

export const useWeb3UsdcBalance = () => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const balance = web3.usdcBalance;

  const query = useCallback(async () => {
    logger.debug("Refreshing balances.");

    await balance.refresh();

    logger.debug("Balances refreshed: @Value", balance.value.getValue());

    return balance.value.getValue();
  }, [balance]);

  return useQuery({
    queryKey: ["balance", "usdc", addr],
    queryFn: query,
  });
};

export const useWeb3UsdcPermitAmount = () => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const amount = web3.usdcPermitAmount;

  const query = useCallback(async () => {
    logger.debug("Refreshing permit amount.");

    await amount.refresh();

    logger.debug("Permit amount refreshed: @Value", amount.value.getValue());

    return amount.value.getValue();
  }, [amount]);

  return useQuery({
    queryKey: ["web3", "usdc", "permit", addr],
    queryFn: query,
  });
};

export const useWeb3RefreshBalances = (): (() => Promise<void>) => {
  const web3 = useClient().web3;
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // invalidate
    queryClient.invalidateQueries({
      queryKey: ["balance"],
    });

    await Promise.all([
      web3.stakingBalance.refresh(),
      web3.usdcBalance.refresh(),
    ]);
  }, [web3.stakingBalance, web3.usdcBalance]);
};

export const useWeb3NeedsSwitchChain = (): boolean => {
  const web3 = useClient().web3;

  return useSyncExternalStore(
    web3.needsToSwitchChains.watch,
    web3.needsToSwitchChains.getValue,
    web3.needsToSwitchChains.getValue,
  );
};

export const useWeb3IsInAppWallet = (): boolean => {
  const web3 = useClient().web3;

  return useSyncExternalStore(
    web3.isInAppWallet.watch,
    web3.isInAppWallet.getValue,
    web3.isInAppWallet.getValue,
  );
};

export const useWeb3Link = () => {
  const web3 = useClient().web3;

  const fn = useCallback(async () => await web3.link(), [web3]);

  return useMutation({
    mutationFn: fn,
  });
};

export const useWeb3SwitchChain = (): (() => Promise<void>) => {
  const web3 = useClient().web3;

  return web3.switchChain;
};

export const useWeb3ApproveAndWatch = (ns: string) => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async (wad: bigint) => {
      const txn = await web3.approve(ns, wad);

      // after txn resolves, invalidate the allowance
      txn.onResolve(() =>
        queryClient.invalidateQueries({
          queryKey: ["allowance", addr],
        }),
      );

      await web3.watch(txn);

      return txn;
    },
    [web3, addr],
  );

  return useMutation({
    mutationFn,
  });
};

export const useWeb3DepositAndWatch = (ns: string) => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async (wad: bigint) => {
      const txn = await web3.deposit(ns, wad);

      // after txn resolves, invalidate the balances
      txn.onResolve(() =>
        queryClient.invalidateQueries({
          queryKey: ["balance"],
        }),
      );

      await web3.watch(txn);

      return txn;
    },
    [web3, addr],
  );

  return useMutation({
    mutationFn,
  });
};

export const useWeb3WatchTxn = () => {
  const web3 = useClient().web3;

  const fn = useCallback(async (txn: Txn) => await web3.watch(txn), [web3]);

  return useMutation({
    mutationFn: fn,
    mutationKey: ["web3", "watch"],
  });
};

export const useWeb3Sign = () => {
  const web3 = useClient().web3;

  const mutationFn = useCallback(
    async (signParams: SignStakeParameters) => {
      return await web3.signStake(signParams);
    },
    [web3],
  );

  return useMutation({
    mutationFn,
  });
};
