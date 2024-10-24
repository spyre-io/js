import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useClient} from "./use-client";
import {useCallback} from "react";

export const useVault = (name: string) => {
  const vaults = useClient().vaults;

  const query = useCallback(async () => {
    await vaults.refresh();

    const vault = vaults.vaults.find((v) => v.name === name);
    return {vault, value: vault ? vaults.getValue(vault) : 0};
  }, [vaults]);

  return useQuery({
    queryKey: ["vault", name],
    queryFn: query,
  });
};

export const useVaultCollect = (name: string) => {
  const client = useClient();
  const queryClient = useQueryClient();
  const vault = client.vaults.vaults.find((v) => v.name === name);

  const fn = useCallback(async () => {
    if (!vault) {
      throw new Error("Vault not found");
    }

    await client.vaults.collect(vault);

    // invalidate
    await queryClient.invalidateQueries({queryKey: ["vault", name]});
    await queryClient.invalidateQueries({queryKey: ["account"]});

    return vault;
  }, [client.vaults, vault]);

  return useMutation({
    mutationFn: fn,
  });
};
