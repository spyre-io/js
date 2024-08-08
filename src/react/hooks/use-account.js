import { useCallback } from "react";
import { useClient } from "./use-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
export const useAccountRefresh = () => {
    const queryClient = useQueryClient();
    return useCallback(() => queryClient.invalidateQueries({ queryKey: ["account"] }), [queryClient]);
};
export const useAccountUpdate = (user) => {
    const client = useClient();
    const query = useCallback(async () => await client.account.update(user), [client, user]);
    return useMutation({
        mutationFn: query,
    });
};
