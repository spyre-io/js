import {useQuery} from "@tanstack/react-query";
import {useClient} from "./use-client";
import {LeaderboardInterval} from "@/core/leaderboards/types";

export const useLbGet = (ns: string, cohort: LeaderboardInterval) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard-get", ns, cohort],
    queryFn: async () => await client.leaderboards.list(ns, cohort),
  });
};

export const useLbWinners = (ns: string, cohort: LeaderboardInterval) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard-winners", ns, cohort],
    queryFn: async () => await client.leaderboards.winners(ns, cohort),
  });
};
