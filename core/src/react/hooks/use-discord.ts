import {useCallback, useMemo} from "react";
import {useAccount} from "./use-account";
import {useClient} from "./use-client";
import {useMutation, useQueryClient} from "@tanstack/react-query";

export const useDiscordConnectionStatus = () => {
  const {isPending, data: account} = useAccount();
  const metadata = useMemo(
    () => JSON.parse(account?.metadata || "{}"),
    [account],
  );

  if (isPending) {
    return "connecting";
  }

  return metadata.discordUserId ? "connected" : "disconnected";
};

export const useDiscordUserId = () => {
  const {data: account} = useAccount();
  const metadata = useMemo(
    () => JSON.parse(account?.metadata || "{}"),
    [account],
  );

  return metadata.discordUserId;
};

export const useDiscordUsername = () => {
  const {data: account} = useAccount();
  const metadata = useMemo(
    () => JSON.parse(account?.metadata || "{}"),
    [account],
  );

  return metadata.discordUserName;
};

export const useDiscordUnlink = () => {
  const {rpc} = useClient();
  const client = useQueryClient();

  const fn = useCallback(async () => {
    await rpc.call("auth/discord/unlink", {});
    await client.invalidateQueries({
      queryKey: ["account"],
    });
  }, [rpc]);

  return useMutation({
    mutationKey: ["discord", "unlink"],
    mutationFn: fn,
  });
};
