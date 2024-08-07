import {useContext, useMemo} from "react";
import {SpyreClientCtx} from "../client-provider";
import {getDeviceId} from "../../client/client";

export const useClient = () => {
  const context = useContext(SpyreClientCtx);
  if (!context) {
    throw new Error("useClient must be used within a SpyreClientProvider.");
  }

  return context;
};

export const useDeviceId = () => {
  const deviceId = useMemo(() => getDeviceId(), []);

  return deviceId;
};
