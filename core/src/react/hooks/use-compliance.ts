import {useMutation, useQuery} from "@tanstack/react-query";
import {useClient} from "./use-client.js";
import {useCallback, useSyncExternalStore} from "react";

export const useComplianceRefresh = () => {
  const {compliance} = useClient();

  return useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      await compliance.refresh();
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

  const fn = useCallback(
    async ({year, month, day}: {year: number; month: number; day: number}) =>
      await compliance.updateBirthday(year, month, day),
    [compliance],
  );

  return useMutation({
    mutationKey: ["compliance", "update-birthday"],
    mutationFn: fn,
  });
};

export const useComplianceRefreshLocation = () => {
  const {compliance} = useClient();

  const fn = useCallback(
    async () => await compliance.updateLocation(),
    [compliance],
  );

  return useMutation({
    mutationKey: ["compliance", "refresh-ip"],
    mutationFn: fn,
  });
};
