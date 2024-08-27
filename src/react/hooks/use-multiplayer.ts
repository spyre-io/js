import {useCallback} from "react";
import {useClient} from "./use-client";
import {useQuery} from "@tanstack/react-query";

export const useMpBrackets = () => {
  const mp = useClient().multiplayer;

  const fn = useCallback(async () => {
    await mp.refreshBrackets();

    return mp.brackets;
  }, [mp]);

  return useQuery({
    queryKey: ["brackets"],
    queryFn: fn,
  });
};

export const useMpMatchmakingFind = () => {};

export const useMpMatchmakingAccept = () => {};
