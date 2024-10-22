import {useQuery} from "@tanstack/react-query";
import {useClient} from "./use-client";
import {LeaderboardInterval} from "@/core/leaderboards/types";

export const useLbGet = (ns: string, interval: LeaderboardInterval) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard-get", ns, interval],
    queryFn: async () => await client.leaderboards.list(ns, interval),
  });
};

export const useLbWinners = (ns: string, interval: LeaderboardInterval) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard-winners", ns, interval],
    queryFn: async () => await client.leaderboards.winners(ns, interval),
  });
};
