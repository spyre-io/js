import {useClient} from "./use-client";

export const useConnectionService = () => useClient().connection;

export const useIsConnected = () => {
  const client = useClient();
  return client.connection.isConnected;
};
