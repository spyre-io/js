import {useCallback} from "react";
import {useClient} from "./use-client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

type GetRaffleResponse = {
  success: boolean;
  error?: string;
  raffles: any[];
  winners: any[];
  entries: {};
  totals: {};
};

type SubmitRaffleResponse = {
  success: boolean;
  error?: string;
};

export const useRaffles = (ns: string) => {
  const client = useClient();

  const fn = useCallback(async () => {
    const res = await client.rpc.call<GetRaffleResponse>("raffle/get", {ns});

    if (!res.success) {
      throw new Error(res.error);
    }

    return {
      raffles: res.raffles,
      winners: res.winners,
      entries: res.entries,
      totals: res.totals,
    };
  }, [client, ns]);

  return useQuery({
    queryKey: ["raffles", ns],
    queryFn: fn,
  });
};

export const useRaffleSubmit = (ns: string) => {
  const client = useClient();
  const queryClient = useQueryClient();

  const fn = useCallback(
    async ({raffleId, numTickets}: {raffleId: number; numTickets: number}) => {
      const res = await client.rpc.call<SubmitRaffleResponse>(
        "raffle/register",
        {
          raffleId,
          numTickets,
        },
      );

      if (!res.success) {
        throw new Error(res.error);
      }

      await queryClient.invalidateQueries({
        queryKey: ["account"],
      });
    },
    [queryClient, client],
  );

  return useMutation({
    mutationKey: ["raffles", ns, "submit"],
    mutationFn: fn,
  });
};
