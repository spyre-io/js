import {useContext} from "react";
import {SpyreClientCtx} from "../client-provider";

export const useClient = () => {
  const context = useContext(SpyreClientCtx);
  if (!context) {
    throw new Error("useClient must be used within a SpyreClientProvider.");
  }

  return context;
};
