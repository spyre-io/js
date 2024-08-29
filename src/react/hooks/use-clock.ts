import {useSyncExternalStore} from "react";
import {useClient} from "./use-client";

export const useClockOffsetMillis = () => {
  const client = useClient();

  return useSyncExternalStore(
    client.clock.offsetMillis.watch,
    client.clock.offsetMillis.getValue,
  );
};
