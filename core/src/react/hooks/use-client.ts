import {useCallback, useContext, useMemo, useSyncExternalStore} from "react";
import {getDeviceId} from "@/core/util";
import {useQueryClient} from "@tanstack/react-query";
import {ISpyreClient} from "@/core/interfaces";
import {SpyreClientCtx} from "@/react/client-provider";

/**
 * Returns the current {@link ISpyreClient} implementaion.
 *
 * ```ts
 * const client = useClient();
 * await client.account.refresh();
 * ```
 */
export const useClient = (): ISpyreClient => {
  const context = useContext(SpyreClientCtx);
  if (!context) {
    throw new Error("useClient must be used within a SpyreClientProvider.");
  }
  /*
  const queryClient = useQueryClient();
  const invalidateMatches = useCallback(() => {
    // Invalidate match + matches query
  }, [context, queryClient]);
  //useNotifHandler(NotificationCodes.BlockchainStakeStatus, invalidateMatches);
*/
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
  return useSyncExternalStore(
    // never changes
    (_: () => void) => () => {},
    getDeviceId,
    // client only
    () => null,
  );
};
