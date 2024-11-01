import {useQuery} from "@tanstack/react-query";
import {useRpcCall} from "./use-rpc";

export const useElo = (ns: string, cohort: string) => {
  const rpc = useRpcCall("elo/get-rating");

  return useQuery({
    queryKey: ["elo", ns, cohort],
    queryFn: async () => {
      const res = (await rpc.mutateAsync({ns, cohort})) as any;
      if (!res.success) {
        throw new Error(res.error);
      }

      return res.rating;
    },
  });
};

export const useEloHistory = (ns: string, cohort: string) => {
  const rpc = useRpcCall("elo/get-rating-history");

  return useQuery({
    queryKey: ["elo", "history", ns, cohort],
    queryFn: async () => {
      const res = (await rpc.mutateAsync({ns, cohort})) as any;
      if (!res.success) {
        throw new Error(res.error);
      }

      return res.ratings;
    },
  });
};
