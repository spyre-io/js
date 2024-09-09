import {useCallback} from "react";
import {useClient} from "./use-client";
import {useMutation} from "@tanstack/react-query";

export const useRpcCall = (id: string) => {
  const client = useClient();

  const fn = useCallback(
    async (input: any) => {
      return await client.rpc.call(id, input);
    },
    [client, id],
  );

  return useMutation({
    mutationFn: fn,
  });
};
