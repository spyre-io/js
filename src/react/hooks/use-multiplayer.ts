import {useCallback, useSyncExternalStore} from "react";
import {useClient} from "./use-client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {MatchmakingAcceptSignals} from "@/core/multiplayer/types";
import {IMatchHandlerFactory} from "@/core/multiplayer/interfaces";

export const useMpBrackets = () => {
  const client = useQueryClient();
  const mp = useClient().multiplayer;

  const fn = useCallback(async () => {
    await mp.refreshBrackets();

    const refreshSecUTC = mp.bracketRefreshSecUTC.getValue();
    const currentSecUTC = Date.now() / 1000;

    // set a timeout to invalidate
    setTimeout(
      () => client.invalidateQueries({queryKey: ["brackets"]}),
      Math.max(1000, (refreshSecUTC - currentSecUTC) * 1000),
    );

    return mp.brackets;
  }, [mp]);

  return useQuery({
    queryKey: ["brackets"],
    queryFn: fn,
    refetchOnWindowFocus: "always",
  });
};

export const useMpBracketRefreshSecUTC = () => {
  const mp = useClient().multiplayer;

  return useSyncExternalStore(
    mp.bracketRefreshSecUTC.watch,
    mp.bracketRefreshSecUTC.getValue,
    mp.bracketRefreshSecUTC.getValue,
  );
};

export const useMpBracket = (id: number) => {
  const mp = useClient().multiplayer;
  const brackets = useMpBrackets();

  const fn = useCallback(async () => {
    return brackets.data?.find((b) => b.id === id);
  }, [mp, brackets]);

  return useQuery({
    queryKey: ["brackets", id],
    queryFn: fn,
    enabled: brackets.isSuccess,
  });
};

export const useMpMatchmakingFind = (bracketId: number) => {
  const mp = useClient().multiplayer;

  const fn = useCallback(async () => {
    await mp.findMatches(bracketId);

    return mp.matchmakingInfo.getValue();
  }, [mp, bracketId]);

  return useQuery({
    queryKey: ["matchmaking", "find", bracketId],
    queryFn: fn,
  });
};

export const useMpMatchmakingAcceptAndJoin = () => {
  const mp = useClient().multiplayer;

  const fn = useCallback(
    async ({
      factory,
      signals,
    }: {
      factory: IMatchHandlerFactory;
      signals?: MatchmakingAcceptSignals;
    }) => await mp.acceptAndJoin(factory, signals),
    [mp],
  );

  return useMutation({
    mutationKey: ["matchmaking", "accept-and-join"],
    mutationFn: fn,
  });
};

export const useMpMatchmakingInfo = () => {
  const mp = useClient().multiplayer;

  return useSyncExternalStore(
    mp.matchmakingInfo.watch,
    mp.matchmakingInfo.getValue,
    mp.matchmakingInfo.getValue,
  );
};

export const useMpMatchmakingJoinIds = () => {
  const mp = useClient().multiplayer;

  return useSyncExternalStore(
    mp.matchJoinIds.watch,
    mp.matchJoinIds.getValue,
    mp.matchJoinIds.getValue,
  );
};

export const useMpMatchId = () => {
  const mp = useClient().multiplayer;

  const get = useCallback(() => {
    const match = mp.match.getValue();
    if (!match) {
      return null;
    }

    const {match_id} = match;
    return match_id;
  }, [mp]);

  return useSyncExternalStore(mp.match.watch, get, get);
};

export const useMpMatchBracketDefId = () => {
  const mp = useClient().multiplayer;

  return useSyncExternalStore(
    mp.matchBracketDefId.watch,
    mp.matchBracketDefId.getValue,
    mp.matchBracketDefId.getValue,
  );
};

export const useMpSend = () => {
  const mp = useClient().multiplayer;

  return useCallback(
    (opCode: number, payload: string | Uint8Array, retries: number = 1) =>
      mp.send(opCode, payload, retries),
    [mp],
  );
};
