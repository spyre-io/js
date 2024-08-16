import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useClient} from "./use-client";
import {useCallback} from "react";

export const useVaults = () => {
  const client = useClient();
  const vaults = client.vaults;

  const query = useCallback(async () => {
    await vaults.refresh();

    return vaults.vaults;
  }, [vaults]);

  return useQuery({
    queryKey: ["vaults"],
    queryFn: query,
  });
};

export const useVaultCollect = (name: string) => {
  const client = useClient();
  const vault = client.vaults.vaults.find((v) => v.name === name);

  const fn = useCallback(async () => {
    if (!vault) {
      throw new Error("Vault not found");
    }

    await client.vaults.collect(vault);

    return vault;
  }, [client.vaults, vault]);

  return useMutation({
    mutationFn: fn,
  });
};
