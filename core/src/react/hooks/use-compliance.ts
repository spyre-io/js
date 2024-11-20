import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useClient} from "./use-client.js";
import {useCallback, useSyncExternalStore} from "react";

export const useComplianceRefresh = (feature: "cashGames" | "raffles") => {
  const {compliance} = useClient();

  return useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      await compliance.refresh();

      if (feature === "raffles") {
        return compliance.raffles.getValue();
      }

      return compliance.cashGames.getValue();
    },
  });
};

export const useComplianceRaffles = () => {
  const {compliance} = useClient();

  return useSyncExternalStore(
    compliance.raffles.watch,
    compliance.raffles.getValue,
    compliance.raffles.getValue,
  );
};

export const useComplianceCashGames = () => {
  const {compliance} = useClient();

  return useSyncExternalStore(
    compliance.cashGames.watch,
    compliance.cashGames.getValue,
    compliance.cashGames.getValue,
  );
};

export const useComplianceUpdateBirthday = () => {
  const {compliance} = useClient();
  const client = useQueryClient();

  const fn = useCallback(
    async ({year, month, day}: {year: number; month: number; day: number}) => {
      await compliance.updateBirthday(year, month, day);

      await client.invalidateQueries({
        queryKey: ["compliance"],
      });
    },
    [client, compliance],
  );

  return useMutation({
    mutationKey: ["compliance", "update-birthday"],
    mutationFn: fn,
  });
};

export const useComplianceUpdateLocation = (
  feature: "cashGames" | "raffles",
) => {
  const {compliance} = useClient();
  const client = useQueryClient();

  const fn = useCallback(async () => {
    await compliance.updateLocation();

    await client.invalidateQueries({
      queryKey: ["compliance"],
    });

    if (feature === "raffles") {
      return compliance.raffles.getValue();
    }

    return compliance.cashGames.getValue();
  }, [client, compliance, feature]);

  return useMutation({
    mutationKey: ["compliance", "refresh-ip"],
    mutationFn: fn,
  });
};
