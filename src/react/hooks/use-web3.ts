import {useActiveWalletConnectionStatus} from "thirdweb/react";
import {useAccountWalletAddress} from "./use-account";
import {useClient} from "./use-client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {Web3Address} from "../../core/web3/types";
import {AsyncOp, AsyncValue, newCancelToken} from "../../core/shared/types";
import {asyncOps} from "../../core/util/async";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

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

export const useWeb3ActiveAddress = (): Web3Address | null => {
  const address = useClient().web3.activeAddress;

  return useSyncExternalStore(address.watch, address.getValue);
};

export const useWeb3LinkedAddress = (): Web3Address | null => {
  const address = useClient().web3.linkedAddress;

  return useSyncExternalStore(address.watch, address.getValue);
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
    await balance.refresh();

    return balance.value.getValue();
  }, [balance]);

  return useQuery({
    queryKey: ["balance", "staking", addr],
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
  );
};

export const useWeb3SwitchChain = (): (() => Promise<void>) => {
  const web3 = useClient().web3;

  return web3.switchChain;
};

export const useWeb3RequiresApproval = (wad: BigInt) => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();

  const query = useCallback(
    async () => await web3.requiresApproval(wad),
    [web3, wad],
  );

  return useQuery({
    queryKey: ["allowance", addr],
    queryFn: query,
  });
};

export const useWeb3Approve = (wad: BigInt) => {
  const web3 = useClient().web3;
  const addr = web3.linkedAddress.getValue();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async () => {
    const txn = await web3.approve(wad);

    // after txn resolves, invalidate the allowance
    txn.onResolve(() =>
      queryClient.invalidateQueries({
        queryKey: ["allowance", addr],
      }),
    );

    return txn;
  }, [web3, addr, wad]);

  return useMutation({
    mutationFn,
  });
};

export const useWeb3Deposit = (wad: BigInt) => {};
