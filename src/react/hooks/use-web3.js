import { useActiveWalletConnectionStatus } from "thirdweb/react";
import { useAccount } from "./use-account";
import { useClient } from "./use-client";
import { useCallback, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// not exported in index
export const useWeb3Thirdweb = () => {
    const web3 = useClient().web3;
    return web3.thirdweb;
};
export const useWeb3ThirdwebNetwork = () => {
    const web3 = useClient().web3;
    return web3.network;
};
// exported
export const useWeb3Config = () => {
    const web3 = useClient().web3;
    return web3.config;
};
export const useWeb3ConnectionStatus = () => useActiveWalletConnectionStatus();
export const useWeb3IsWalletConnected = () => {
    const status = useActiveWalletConnectionStatus();
    return status === "connected";
};
export const useWeb3IsWalletConnectedAndLinked = () => {
    const status = useActiveWalletConnectionStatus();
    const connectedAddress = useWeb3ActiveAddress();
    const { data: account } = useAccount();
    return (status === "connected" &&
        connectedAddress &&
        account &&
        connectedAddress === account.walletAddr);
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
export const useWeb3RefreshBalances = () => {
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
export const useWeb3NeedsSwitchChain = () => {
    const web3 = useClient().web3;
    return useSyncExternalStore(web3.needsToSwitchChains.watch, web3.needsToSwitchChains.getValue);
};
export const useWeb3SwitchChain = () => {
    const web3 = useClient().web3;
    return web3.switchChain;
};
export const useWeb3RequiresApproval = (wad) => {
    const web3 = useClient().web3;
    const addr = web3.linkedAddress.getValue();
    const query = useCallback(async () => await web3.requiresApproval(wad), [web3, wad]);
    return useQuery({
        queryKey: ["allowance", addr],
        queryFn: query,
    });
};
export const useWeb3Approve = (wad) => {
    const web3 = useClient().web3;
    const addr = web3.linkedAddress.getValue();
    const queryClient = useQueryClient();
    const mutationFn = useCallback(async () => {
        const txn = await web3.approve(wad);
        // after txn resolves, invalidate the allowance
        txn.onResolve(() => queryClient.invalidateQueries({
            queryKey: ["allowance", addr],
        }));
        return txn;
    }, [web3, addr, wad]);
    return useMutation({
        mutationFn,
    });
};
export const useWeb3Deposit = (wad) => {
    const web3 = useClient().web3;
    const addr = web3.linkedAddress.getValue();
    const queryClient = useQueryClient();
    const mutationFn = useCallback(async () => {
        const txn = await web3.deposit(wad);
        // after txn resolves, invalidate the balances
        txn.onResolve(() => queryClient.invalidateQueries({
            queryKey: ["balance"],
        }));
        return txn;
    }, [web3, addr, wad]);
    return useMutation({
        mutationFn,
    });
};
