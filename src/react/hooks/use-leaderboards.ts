import {useQuery} from "@tanstack/react-query";
import {useClient} from "./use-client";

export const useLb = (
  cohort: "daily" | "weekly" | "all-time",
  tag: string,
  count: number = 100,
) => {
  if (cohort === "daily") {
    return useLbDaily(tag, count);
  } else if (cohort === "weekly") {
    return useLbWeekly(tag, count);
  }

  return useLbAll(tag, count);
};

export const useLbDaily = (tag: string, count: number = 100) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard", "daily"],
    queryFn: async () => await client.leaderboards.daily(tag, count),
  });
};

export const useLbWeekly = (tag: string, count: number = 100) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard", "weekly"],
    queryFn: async () => await client.leaderboards.weekly(tag, count),
  });
};

export const useLbAll = (tag: string, count: number = 100) => {
  const client = useClient();

  return useQuery({
    queryKey: ["leaderboard", "all"],
    queryFn: async () => await client.leaderboards.all(tag, count),
  });
};
