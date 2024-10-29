import {useWeb3ConnectionStatus} from "@spyre-io/js";
import {useMemo} from "react";

/**
 * Props for the `WalletConnection` component.
 */
export type WalletConnectionProps = {
  /**
   * A custom component to render when the wallet is connected.
   */
  connected?: () => JSX.Element;

  /**
   * A custom component to render when the wallet is connecting.
   */
  connecting?: () => JSX.Element;

  /**
   * A custom component to render when the wallet is disconnected.
   */
  disconnected?: () => JSX.Element;
};

/**
 * Connect button.
 */
export function WalletConnection({
  connected,
  connecting,
  disconnected,
}: WalletConnectionProps) {
  const status = useWeb3ConnectionStatus();

  return useMemo(() => {
    switch (status) {
      case "connected":
        return connected ? connected() : <div>Connected</div>;
      case "disconnected":
        return disconnected ? disconnected() : <div>Disconnected</div>;
    }

    return connecting ? connecting() : <div>Connecting</div>;
  }, [status, connected, connecting, disconnected]);
}
