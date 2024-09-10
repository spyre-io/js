import {useCallback, useSyncExternalStore} from "react";
import {useClient} from "./use-client";
import {useMutation, useQuery} from "@tanstack/react-query";
import {MatchmakingAcceptSignals} from "@/core/multiplayer/types";
import {IMatchHandlerFactory} from "@/core/multiplayer/interfaces";

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
  );
};

export const useMpMatchmakingJoinIds = () => {
  const mp = useClient().multiplayer;

  return useSyncExternalStore(mp.matchJoinIds.watch, mp.matchJoinIds.getValue);
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

  return useSyncExternalStore(mp.match.watch, get);
};

export const useMpSend = () => {
  const mp = useClient().multiplayer;

  return useCallback(
    (opCode: number, payload: string | Uint8Array, retries: number = 1) =>
      mp.send(opCode, payload, retries),
    [mp],
  );
};
