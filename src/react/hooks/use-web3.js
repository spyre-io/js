import {
  useActiveAccount,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";
import {useAccountWalletAddress} from "./use-account";

export const useActiveAddress = () => useActiveAccount()?.address;

export const useIsWalletConnected = () => {
  const status = useActiveWalletConnectionStatus();
  const connectedAddress = useActiveAddress();
  const accountAddress = useAccountWalletAddress();

  return (
    status === "connected" &&
    connectedAddress &&
    accountAddress &&
    connectedAddress === accountAddress
  );
};
