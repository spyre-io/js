import {
  createSpyreClient,
  CreateSpyreClientOptions,
  ISpyreClient,
} from "../client/client";
import {createContext, PropsWithChildren, useMemo} from "react";

export const SpyreClientCtx = createContext<ISpyreClient | undefined>(
  undefined,
);

export function SpyreClientProvider(
  props: PropsWithChildren<{
    config: CreateSpyreClientOptions;
    client?: ISpyreClient;
  }>,
) {
  const client = useMemo(
    () => props.client || createSpyreClient(props.config),
    [props.client, props.config],
  );

  return (
    <SpyreClientCtx.Provider value={client}>
      {props.children}
    </SpyreClientCtx.Provider>
  );
}
