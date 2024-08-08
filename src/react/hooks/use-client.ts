import {useContext, useMemo} from "react";
import {SpyreClientCtx} from "../client-provider";
import {getDeviceId} from "../../core/client";

/**
 * Returns the current {@link ISpyreClient} implementaion.
 *
 * ```ts
 * const client = useClient();
 * await client.account.refresh();
 * ```
 */
export const useClient = () => {
  const context = useContext(SpyreClientCtx);
  if (!context) {
    throw new Error("useClient must be used within a SpyreClientProvider.");
  }

  return context;
};

/**
 * Returns the current device ID. A device ID is a unique GUID that is stored in local storage.
 *
 * ```ts
 * const deviceId = useDeviceId();
 *
 * console.log("My device ID is:", deviceId);
 * ```
 */
export const useDeviceId = () => {
  const deviceId = useMemo(() => getDeviceId(), []);

  return deviceId;
};
